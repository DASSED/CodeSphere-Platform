import type { Database } from "@codesphere/db";
import { sql } from "drizzle-orm";

export type KpiPeriod = "7d" | "30d";

const DAY = 24 * 60 * 60 * 1000;

/** Length of each window and how it is cut for the trend: 7 × 1 day, or 6 × 5 days. */
export const KPI_WINDOWS: Record<KpiPeriod, { days: number; buckets: number }> =
	{
		"7d": { days: 7, buckets: 7 },
		"30d": { days: 30, buckets: 6 },
	};

/** Raw counts of one window, as the query returns them. */
export type WindowCounts = {
	activeMembers: number;
	questions: number;
	answered: number;
	accepted: number;
	medianFirstAnswerMinutes: number | null;
	posts: number;
	agentPosts: number;
};

type Window = { from: Date; to: Date };

const ratio = (part: number, whole: number) =>
	whole > 0 ? part / whole : null;

/** The metrics of one window, in the order of the page. */
export function metricsOf(counts: WindowCounts) {
	return {
		activeMembers: counts.activeMembers,
		questions: counts.questions,
		answerRate: ratio(counts.answered, counts.questions),
		medianFirstAnswerMinutes: counts.medianFirstAnswerMinutes,
		unanswered: counts.questions - counts.answered,
		acceptedRate: ratio(counts.accepted, counts.questions),
		agentShare: ratio(counts.agentPosts, counts.posts),
	};
}

export type MetricId = keyof ReturnType<typeof metricsOf>;

/** The current window, the one before it, and the current one cut into equal buckets. */
export function windowsOf(period: KpiPeriod, now: Date) {
	const { days, buckets } = KPI_WINDOWS[period];
	const length = days * DAY;
	const to = now;
	const from = new Date(to.getTime() - length);
	const step = length / buckets;
	return {
		current: { from, to },
		previous: { from: new Date(from.getTime() - length), to: from },
		buckets: Array.from({ length: buckets }, (_, i) => ({
			from: new Date(from.getTime() + i * step),
			to: new Date(from.getTime() + (i + 1) * step),
		})),
	};
}

const rowsOf = (result: unknown) =>
	(Array.isArray(result)
		? result
		: (result as { rows: unknown[] }).rows) as Record<string, unknown>[];

const toNumber = (value: unknown) =>
	value === null || value === undefined ? null : Number(value);

// Timestamps are stored without a time zone, in UTC: compare with UTC literals.
const at = (date: Date) => sql`${date.toISOString()}::timestamp`;

/**
 * Counts of one window [from, to) in a single query. Deleted Questions and Answers do not
 * count. An active Member is a human who asked, answered or voted in the window.
 */
export async function countWindow(
	db: Database,
	{ from, to }: Window,
): Promise<WindowCounts> {
	const inWindow = (column: ReturnType<typeof sql.raw>) =>
		sql`${column} >= ${at(from)} AND ${column} < ${at(to)}`;
	const result = await db.execute(sql`
		WITH q AS (
			SELECT q.created_at, q.accepted_answer_id, u.kind,
				(SELECT min(a.created_at) FROM answers a
					WHERE a.question_id = q.id AND a.deleted_at IS NULL) AS first_answer_at
			FROM questions q JOIN "user" u ON u.id = q.author_id
			WHERE q.deleted_at IS NULL AND ${inWindow(sql.raw("q.created_at"))}
		), a AS (
			SELECT u.kind FROM answers a JOIN "user" u ON u.id = a.author_id
			WHERE a.deleted_at IS NULL AND ${inWindow(sql.raw("a.created_at"))}
		), actors AS (
			SELECT author_id AS id FROM questions
				WHERE deleted_at IS NULL AND ${inWindow(sql.raw("created_at"))}
			UNION SELECT author_id FROM answers
				WHERE deleted_at IS NULL AND ${inWindow(sql.raw("created_at"))}
			UNION SELECT user_id FROM votes WHERE ${inWindow(sql.raw("created_at"))}
		)
		SELECT
			(SELECT count(*) FROM actors JOIN "user" u ON u.id = actors.id
				WHERE u.kind = 'human')::int AS "activeMembers",
			(SELECT count(*) FROM q)::int AS "questions",
			(SELECT count(*) FROM q WHERE first_answer_at IS NOT NULL)::int AS "answered",
			(SELECT count(*) FROM q WHERE accepted_answer_id IS NOT NULL)::int AS "accepted",
			(SELECT percentile_cont(0.5) WITHIN GROUP (
				ORDER BY extract(epoch FROM first_answer_at - created_at) / 60)
				FROM q WHERE first_answer_at IS NOT NULL) AS "medianFirstAnswerMinutes",
			((SELECT count(*) FROM q) + (SELECT count(*) FROM a))::int AS "posts",
			((SELECT count(*) FROM q WHERE kind = 'agent')
				+ (SELECT count(*) FROM a WHERE kind = 'agent'))::int AS "agentPosts"`);
	const [row = {}] = rowsOf(result);
	return {
		activeMembers: toNumber(row.activeMembers) ?? 0,
		questions: toNumber(row.questions) ?? 0,
		answered: toNumber(row.answered) ?? 0,
		accepted: toNumber(row.accepted) ?? 0,
		medianFirstAnswerMinutes: toNumber(row.medianFirstAnswerMinutes),
		posts: toNumber(row.posts) ?? 0,
		agentPosts: toNumber(row.agentPosts) ?? 0,
	};
}

/** The KPI report of the admin (#113): each metric with its previous value and its trend. */
export async function kpiReport(
	db: Database,
	period: KpiPeriod,
	now = new Date(),
) {
	const windows = windowsOf(period, now);
	const count = (window: Window) => countWindow(db, window).then(metricsOf);
	const [current, previous, buckets] = await Promise.all([
		count(windows.current),
		count(windows.previous),
		Promise.all(windows.buckets.map(count)),
	]);
	const ids = Object.keys(current) as MetricId[];
	return {
		period,
		from: windows.current.from.toISOString(),
		to: windows.current.to.toISOString(),
		metrics: ids.map((id) => ({
			id,
			value: current[id],
			previous: previous[id],
			trend: buckets.map((bucket) => bucket[id]),
		})),
	};
}
