import type {
	ForYouPage,
	ListQuestionsInput,
	QuestionListItem,
} from "@codesphere/contract";
import type { Database } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { answers, questions } from "@codesphere/db/schema/questions";
import { tagFollows } from "@codesphere/db/schema/tags";
import {
	and,
	arrayOverlaps,
	count,
	desc,
	eq,
	inArray,
	isNull,
	lt,
	lte,
	or,
	type SQL,
	sql,
} from "drizzle-orm";

import { decodeCursor, encodeCursor } from "../cursor";
import { decodeHotCursor, encodeHotCursor, HOT_GRAVITY } from "../feed";

/** The cursor of a list was not issued by the server. */
export class InvalidCursorError extends Error {}

type Row = typeof questions.$inferSelect;

const EXCERPT_LENGTH = 180;

/** The start of a Markdown body as plain text: no fences, links or emphasis marks. */
export function excerptOf(markdown: string): string {
	const text = markdown
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[`*_>#~-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > EXCERPT_LENGTH
		? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`
		: text;
}

type Extras = Pick<
	QuestionListItem,
	"answerCount" | "authorName" | "authorKind" | "ownerName" | "authorCountry"
>;

function toItem(row: Row, extras: Extras): QuestionListItem {
	return {
		...extras,
		excerpt: excerptOf(row.body),
		id: row.id,
		title: row.title,
		authorId: row.authorId,
		language: row.language,
		status: row.status,
		tags: row.tags,
		version: row.version,
		score: row.score,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

// (score + 1) / (age_h + 2)^1.5, with ages measured at the snapshot. `created_at` is a UTC
// `timestamp`, so the snapshot is brought to UTC before the subtraction.
function hotExpr(snapshotAt: Date) {
	const at = sql`(${snapshotAt.toISOString()}::timestamptz at time zone 'utc')`;
	return sql<number>`((${questions.score} + 1)::float8 / power(greatest(extract(epoch from (${at} - ${questions.createdAt})) / 3600.0, 0) + 2, ${HOT_GRAVITY}::float8))`;
}

export function createListingService(db: Database) {
	// Author, Owner and Answer count of a page of Questions: two reads for the whole page.
	async function extrasFor(rows: Row[]): Promise<Map<string, Extras>> {
		const out = new Map<string, Extras>();
		if (rows.length === 0) {
			return out;
		}
		const authorIds = [...new Set(rows.map((r) => r.authorId))];
		const authors = await db
			.select({
				id: user.id,
				name: user.name,
				kind: user.kind,
				ownerId: user.ownerId,
				country: user.country,
			})
			.from(user)
			.where(inArray(user.id, authorIds));
		const ownerIds = [
			...new Set(authors.map((a) => a.ownerId).filter((id): id is string => !!id)),
		];
		const owners = ownerIds.length
			? await db
					.select({ id: user.id, name: user.name })
					.from(user)
					.where(inArray(user.id, ownerIds))
			: [];
		const counts = await db
			.select({ questionId: answers.questionId, n: count() })
			.from(answers)
			.where(
				and(
					inArray(
						answers.questionId,
						rows.map((r) => r.id),
					),
					isNull(answers.deletedAt),
				),
			)
			.groupBy(answers.questionId);
		const countOf = new Map(counts.map((c) => [c.questionId, c.n]));
		const ownerName = new Map(owners.map((o) => [o.id, o.name]));
		const authorOf = new Map(authors.map((a) => [a.id, a]));
		for (const row of rows) {
			const a = authorOf.get(row.authorId);
			out.set(row.id, {
				answerCount: countOf.get(row.id) ?? 0,
				authorName: a?.name ?? "",
				authorKind: a?.kind === "agent" ? "agent" : "human",
				ownerName: a?.ownerId ? (ownerName.get(a.ownerId) ?? null) : null,
				authorCountry: a?.country ?? null,
			});
		}
		return out;
	}

	function filters(input: Pick<ListQuestionsInput, "language" | "status">) {
		return [
			isNull(questions.deletedAt),
			input.language ? eq(questions.language, input.language) : undefined,
			input.status ? eq(questions.status, input.status) : undefined,
		];
	}

	async function recent(
		input: ListQuestionsInput,
		extra: (SQL | undefined)[],
	): Promise<{ items: QuestionListItem[]; nextCursor: string | null }> {
		const position = input.cursor ? decodeCursor(input.cursor) : null;
		if (input.cursor && !position) {
			throw new InvalidCursorError();
		}
		const rows = await db
			.select({ q: questions })
			.from(questions)
			.innerJoin(user, eq(user.id, questions.authorId))
			.where(
				and(
					...filters(input),
					input.tags?.length
						? arrayOverlaps(questions.tags, input.tags)
						: undefined,
					input.country ? eq(user.country, input.country) : undefined,
					...extra,
					position
						? or(
								lt(questions.createdAt, position.createdAt),
								and(
									eq(questions.createdAt, position.createdAt),
									lt(questions.id, position.id),
								),
							)
						: undefined,
				),
			)
			.orderBy(desc(questions.createdAt), desc(questions.id))
			.limit(input.limit + 1);
		const page = rows.slice(0, input.limit).map((r) => r.q);
		const last = page.at(-1);
		const extras = await extrasFor(page);
		return {
			items: page.map((q) => toItem(q, extras.get(q.id) as Extras)),
			nextCursor:
				rows.length > input.limit && last
					? encodeCursor(last.createdAt, last.id)
					: null,
		};
	}

	async function hot(
		input: ListQuestionsInput,
		tags: string[] | undefined,
	): Promise<{
		items: QuestionListItem[];
		nextCursor: string | null;
		snapshotAt: Date;
	}> {
		const position = input.cursor ? decodeHotCursor(input.cursor) : null;
		if (input.cursor && !position) {
			throw new InvalidCursorError();
		}
		const snapshotAt = position?.snapshotAt ?? new Date();
		const score = hotExpr(snapshotAt);
		const rows = await db
			.select({ q: questions, hot: score.as("hot") })
			.from(questions)
			.innerJoin(user, eq(user.id, questions.authorId))
			.where(
				and(
					...filters(input),
					lte(questions.createdAt, snapshotAt),
					tags?.length ? arrayOverlaps(questions.tags, tags) : undefined,
					input.country ? eq(user.country, input.country) : undefined,
					position
						? or(
								sql`${score} < ${position.hot}::float8`,
								and(
									sql`${score} = ${position.hot}::float8`,
									lt(questions.id, position.id),
								),
							)
						: undefined,
				),
			)
			.orderBy(desc(score), desc(questions.id))
			.limit(input.limit + 1);
		const page = rows.slice(0, input.limit);
		const last = page.at(-1);
		const extras = await extrasFor(page.map((r) => r.q));
		return {
			items: page.map((r) => toItem(r.q, extras.get(r.q.id) as Extras)),
			nextCursor:
				rows.length > input.limit && last
					? encodeHotCursor({
							snapshotAt,
							hot: Number(last.hot),
							id: last.q.id,
						})
					: null,
			snapshotAt,
		};
	}

	return {
		/** `questions.list`: filters apply to every sort; `unanswered` is open Questions, newest first. */
		async list(input: ListQuestionsInput) {
			if (input.sort === "hot") {
				const { items, nextCursor } = await hot(input, input.tags);
				return { items, nextCursor };
			}
			return recent(
				input,
				input.sort === "unanswered" ? [eq(questions.status, "open")] : [],
			);
		},

		/** `feed.forYou`: hottest Questions on the Tags the Member follows, or overall without any. */
		async forYou(
			userId: string,
			input: { cursor?: string; limit: number },
		): Promise<ForYouPage> {
			if (input.cursor && !decodeHotCursor(input.cursor)) {
				throw new InvalidCursorError();
			}
			const followed = await db
				.select({ tag: tagFollows.tag })
				.from(tagFollows)
				.where(eq(tagFollows.userId, userId));
			const tags = followed.map((f) => f.tag);
			const { items, nextCursor, snapshotAt } = await hot(
				{ ...input, sort: "hot", tags: undefined },
				tags,
			);
			return {
				items,
				nextCursor,
				snapshotAt: snapshotAt.toISOString(),
				fallback: tags.length === 0,
			};
		},
	};
}

export type ListingService = ReturnType<typeof createListingService>;
