/// <reference types="bun" />
// Integration test of the admin KPIs against a real Postgres (#113). The rows are dated in 2099,
// so the counts of the window are only this test's, whatever else the database holds.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { answers, questions, votes } from "@codesphere/db/schema/questions";
import { inArray } from "drizzle-orm";

import { kpiReport } from "./admin-kpi";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin KPI on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const asker = `it-kpi-asker-${run}`;
	const helper = `it-kpi-helper-${run}`;
	const voter = `it-kpi-voter-${run}`;
	const bot = `it-kpi-bot-${run}`;
	const ids = [asker, helper, voter, bot];
	const now = new Date("2099-01-08T00:00:00.000Z");
	const day = (d: number, h = 0) => new Date(Date.UTC(2099, 0, d, h, 0, 0, 0));

	const question = (authorId: string, createdAt: Date) => ({
		authorId,
		idempotencyKey: crypto.randomUUID(),
		title: "KPI question",
		body: "b",
		bodyHtml: "<p>b</p>",
		language: "en" as const,
		tags: ["sql"],
		createdAt,
	});
	const answer = (questionId: string, authorId: string, createdAt: Date) => ({
		questionId,
		authorId,
		idempotencyKey: crypto.randomUUID(),
		body: "a",
		bodyHtml: "<p>a</p>",
		createdAt,
	});

	beforeAll(async () => {
		await db.insert(user).values([
			...[asker, helper, voter].map((id) => ({
				id,
				name: id,
				email: `${id}@example.com`,
			})),
			{
				id: bot,
				name: bot,
				email: `${bot}@example.com`,
				kind: "agent",
				ownerId: helper,
			},
		]);
		// In the window (Jan 1 to Jan 8): three Questions, two answered (after 1 h and 3 h),
		// one accepted, one answer by an agent. Before it: one Question, none answered.
		const [q1, q2] = await db
			.insert(questions)
			.values([
				question(asker, day(2)),
				question(asker, day(3)),
				question(bot, day(5)),
				question(asker, day(28 - 31)),
			])
			.returning();
		const [a1] = await db
			.insert(answers)
			.values([
				answer(q1?.id ?? "", helper, day(2, 1)),
				answer(q2?.id ?? "", bot, day(3, 3)),
			])
			.returning();
		await db
			.update(questions)
			.set({ acceptedAnswerId: a1?.id })
			.where(inArray(questions.id, [q1?.id ?? ""]));
		await db.insert(votes).values({
			userId: voter,
			targetType: "question",
			targetId: q1?.id ?? "",
			value: 1,
			createdAt: day(4),
		});
	});

	afterAll(async () => {
		await db.delete(votes).where(inArray(votes.userId, ids));
		await db.delete(answers).where(inArray(answers.authorId, ids));
		await db.delete(questions).where(inArray(questions.authorId, ids));
		await db.delete(user).where(inArray(user.id, ids));
	});

	test("counts the window, the one before it and the daily trend", async () => {
		const report = await kpiReport(db, "7d", now);
		const metric = (id: string) => report.metrics.find((m) => m.id === id);

		expect(report.from).toBe("2099-01-01T00:00:00.000Z");
		// Humans only: the asker, the helper and the voter, not the agent.
		expect(metric("activeMembers")).toMatchObject({ value: 3, previous: 1 });
		expect(metric("questions")).toMatchObject({ value: 3, previous: 1 });
		expect(metric("answerRate")?.value).toBeCloseTo(2 / 3);
		expect(metric("unanswered")).toMatchObject({ value: 1, previous: 1 });
		expect(metric("acceptedRate")?.value).toBeCloseTo(1 / 3);
		expect(metric("medianFirstAnswerMinutes")?.value).toBe(120);
		// One Question and one Answer by the agent, out of five posts.
		expect(metric("agentShare")?.value).toBeCloseTo(2 / 5);
		expect(metric("questions")?.trend).toEqual([0, 1, 1, 0, 1, 0, 0]);
		expect(metric("answerRate")?.trend[0]).toBeNull();
	});
});
