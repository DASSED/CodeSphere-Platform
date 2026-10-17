/// <reference types="bun" />
// Integration test of `questions.list` and `feed.forYou` against a real Postgres (#65): filters,
// the three sorts, hot-score ordering, the fallback without followed Tags, and a stable order
// across pages.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { questions } from "@codesphere/db/schema/questions";
import { tagFollows } from "@codesphere/db/schema/tags";
import { createRouterClient } from "@orpc/server";
import { inArray } from "drizzle-orm";

import { appRouter } from "../routers";
import { testContext } from "../test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("questions.list and feed.forYou on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const tag = `it-feed-${run.slice(0, 8)}`;
	const otherTag = `it-other-${run.slice(0, 8)}`;
	const bf = `it-feed-bf-${run}`;
	const ng = `it-feed-ng-${run}`;
	const reader = `it-feed-reader-${run}`;
	const loner = `it-feed-loner-${run}`;
	const ids: string[] = [];

	const session = (id: string, kind = "human") =>
		({
			user: { id, role: "member", kind },
			session: { id: `s-${id}` },
		}) as unknown as Session;
	const clientAs = (id: string | null, kind = "human") =>
		createRouterClient(appRouter, {
			context: testContext({ db, session: id ? session(id, kind) : null }),
		});

	let seq = 0;
	// `hoursAgo` back-dates the Question so the hot score has an age to decay with.
	const ask = async (
		authorId: string,
		over: Partial<typeof questions.$inferInsert> & { hoursAgo?: number } = {},
	) => {
		const { hoursAgo = 1, ...rest } = over;
		const [row] = await db
			.insert(questions)
			.values({
				authorId,
				idempotencyKey: crypto.randomUUID(),
				title: `Question ${++seq}`,
				body: "b",
				bodyHtml: "<p>b</p>",
				language: "en",
				tags: [tag],
				createdAt: new Date(Date.now() - hoursAgo * 3_600_000),
				...rest,
			})
			.returning();
		if (!row) {
			throw new Error("insert failed");
		}
		ids.push(row.id);
		return row;
	};

	beforeAll(async () => {
		await db.insert(user).values([
			{ id: bf, name: bf, email: `${bf}@example.com`, country: "BF" },
			{ id: ng, name: ng, email: `${ng}@example.com`, country: "NG" },
			{ id: reader, name: reader, email: `${reader}@example.com` },
			{ id: loner, name: loner, email: `${loner}@example.com` },
		]);
		await db.insert(tagFollows).values({ userId: reader, tag });
	});

	afterAll(async () => {
		await db.delete(questions).where(inArray(questions.id, ids));
		await db.delete(tagFollows).where(inArray(tagFollows.userId, [reader]));
		await db.delete(user).where(inArray(user.id, [bf, ng, reader, loner]));
	});

	test("list filters by Tag, language, author country and status", async () => {
		const fr = await ask(bf, { language: "fr", tags: [tag, otherTag] });
		const closed = await ask(ng, { status: "closed" });
		const anon = clientAs(null);

		const byTag = await anon.questions.list({
			tags: [otherTag],
			sort: "recent",
			limit: 50,
		});
		expect(byTag.items.map((i) => i.id)).toEqual([fr.id]);

		const byLanguage = await anon.questions.list({
			tags: [tag],
			language: "fr",
			sort: "recent",
			limit: 50,
		});
		expect(byLanguage.items.map((i) => i.id)).toEqual([fr.id]);

		const byCountry = await anon.questions.list({
			tags: [tag],
			country: "NG",
			sort: "recent",
			limit: 50,
		});
		expect(byCountry.items.every((i) => i.authorId === ng)).toBe(true);

		const byStatus = await anon.questions.list({
			tags: [tag],
			status: "closed",
			sort: "recent",
			limit: 50,
		});
		expect(byStatus.items.map((i) => i.id)).toEqual([closed.id]);
	});

	test("unanswered lists open Questions only, newest first", async () => {
		const done = await ask(bf, { status: "answered", hoursAgo: 0.1 });
		const page = await clientAs(null).questions.list({
			tags: [tag],
			sort: "unanswered",
			limit: 50,
		});
		expect(page.items.some((i) => i.id === done.id)).toBe(false);
		expect(page.items.every((i) => i.status === "open")).toBe(true);
		const times = page.items.map((i) => Date.parse(i.createdAt));
		expect(times).toEqual([...times].sort((a, b) => b - a));
	});

	test("a deleted Question never appears", async () => {
		const gone = await ask(bf, { deletedAt: new Date() });
		const page = await clientAs(null).questions.list({
			tags: [tag],
			sort: "recent",
			limit: 50,
		});
		expect(page.items.some((i) => i.id === gone.id)).toBe(false);
	});

	test("hot sort puts a voted Question above a fresher unvoted one", async () => {
		const tagHot = `${tag}-hot`;
		const voted = await ask(bf, { tags: [tagHot], score: 20, hoursAgo: 5 });
		const fresh = await ask(bf, { tags: [tagHot], score: 0, hoursAgo: 0.5 });
		const old = await ask(bf, { tags: [tagHot], score: 0, hoursAgo: 48 });
		const page = await clientAs(null).questions.list({
			tags: [tagHot],
			sort: "hot",
			limit: 50,
		});
		expect(page.items.map((i) => i.id)).toEqual([voted.id, fresh.id, old.id]);
	});

	test("hot pages keep one stable order with no repeat and no skip", async () => {
		const tagPage = `${tag}-page`;
		const made = [];
		for (let i = 0; i < 7; i++) {
			made.push(await ask(ng, { tags: [tagPage], score: i % 3, hoursAgo: i }));
		}
		const anon = clientAs(null);
		const seen: string[] = [];
		let cursor: string | undefined;
		do {
			const page = await anon.questions.list({
				tags: [tagPage],
				sort: "hot",
				limit: 3,
				cursor,
			});
			seen.push(...page.items.map((i) => i.id));
			cursor = page.nextCursor ?? undefined;
		} while (cursor);
		expect(seen).toHaveLength(made.length);
		expect(new Set(seen).size).toBe(made.length);
		const whole = await anon.questions.list({
			tags: [tagPage],
			sort: "hot",
			limit: 50,
		});
		expect(seen).toEqual(whole.items.map((i) => i.id));
	});

	test("forYou follows the Member's Tags, hottest first", async () => {
		const followed = await ask(bf, { tags: [tag], score: 50, hoursAgo: 2 });
		const elsewhere = await ask(bf, { tags: [otherTag], score: 500 });
		const page = await clientAs(reader).feed.forYou({ limit: 50 });
		expect(page.fallback).toBe(false);
		expect(page.items.some((i) => i.id === followed.id)).toBe(true);
		expect(page.items.some((i) => i.id === elsewhere.id)).toBe(false);
		expect(page.items[0]?.id).toBe(followed.id);
	});

	test("forYou keeps the Member's own Questions outside their followed Tags", async () => {
		const own = await ask(reader, { tags: [otherTag], score: 0 });
		const page = await clientAs(reader).feed.forYou({ limit: 50 });
		expect(page.fallback).toBe(false);
		expect(page.items.some((i) => i.id === own.id)).toBe(true);
	});

	test("forYou falls back to the hottest Questions overall without a followed Tag", async () => {
		const hottest = await ask(ng, { tags: [otherTag], score: 10_000 });
		const page = await clientAs(loner).feed.forYou({ limit: 50 });
		expect(page.fallback).toBe(true);
		expect(page.items[0]?.id).toBe(hottest.id);
	});

	test("forYou excludes Questions asked after the snapshot", async () => {
		const first = await clientAs(reader).feed.forYou({ limit: 1 });
		const late = await ask(bf, { tags: [tag], score: 1_000_000, hoursAgo: 0 });
		if (first.nextCursor) {
			const next = await clientAs(reader).feed.forYou({
				limit: 50,
				cursor: first.nextCursor,
			});
			expect(next.items.some((i) => i.id === late.id)).toBe(false);
		}
	});

	test("an Agent is FORBIDDEN and a visitor UNAUTHORIZED on forYou", async () => {
		await expect(
			clientAs(reader, "agent").feed.forYou({ limit: 5 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(
			clientAs(null).feed.forYou({ limit: 5 }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
