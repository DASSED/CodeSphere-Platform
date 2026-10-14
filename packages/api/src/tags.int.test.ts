/// <reference types="bun" />
// Integration test against a real Postgres (#44); skipped without TEST_DATABASE_URL.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { questions } from "@codesphere/db/schema/questions";
import { tag, tagFollows } from "@codesphere/db/schema/tags";
import { createRouterClient } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("tags on Postgres (#44)", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID().slice(0, 8);
	const memberId = `it-tag-member-${run}`;
	const name = (suffix: string) => `it44-${run}-${suffix}`;

	const clientAs = (id: string | null) =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: id
					? ({
							user: { id, role: "member", kind: "human" },
							session: { id: "s1" },
						} as unknown as Session)
					: null,
			}),
		});

	beforeAll(async () => {
		await db.insert(user).values({
			id: memberId,
			name: "IT member",
			email: `${memberId}@example.com`,
		});
	});

	afterAll(async () => {
		await db.delete(tagFollows).where(eq(tagFollows.userId, memberId));
		await db.delete(questions).where(eq(questions.authorId, memberId));
		await db
			.delete(tag)
			.where(inArray(tag.name, [name("a"), name("b"), name("c")]));
		await db.delete(user).where(eq(user.id, memberId));
	});

	test("a Question's Tags become official Tags, normalized", async () => {
		await clientAs(memberId).questions.create({
			idempotencyKey: crypto.randomUUID(),
			title: "Un titre assez long",
			body: "Un corps de question assez long pour passer.",
			language: "fr",
			tags: [` ${name("A")} `, name("b")],
		});
		const found = await clientAs(null).tags.search({ q: name("a"), limit: 10 });
		expect(found.items.map((t) => t.name)).toEqual([name("a")]);
		expect(found.items[0]).toMatchObject({ questionCount: 1, followed: false });
	});

	test("`JavaScript ` and `javascript` are the same Tag when searching and following", async () => {
		const member = clientAs(memberId);
		const upper = await member.tags.follow({
			tag: ` ${name("A").toUpperCase()} `,
		});
		const lower = await member.tags.follow({ tag: name("a") });
		expect(upper.name).toBe(name("a"));
		expect(lower.name).toBe(name("a"));
	});

	test("following twice is idempotent, and the follow is visible", async () => {
		const member = clientAs(memberId);
		await member.tags.follow({ tag: name("a") });
		const followed = await member.tags.followed();
		expect(followed.items.filter((t) => t.name === name("a"))).toHaveLength(1);
		const searched = await member.tags.search({ q: name("a"), limit: 10 });
		expect(searched.items[0]?.followed).toBe(true);
	});

	test("unfollowing is idempotent", async () => {
		const member = clientAs(memberId);
		await member.tags.unfollow({ tag: name("a") });
		await expect(member.tags.unfollow({ tag: name("a") })).resolves.toEqual({
			success: true,
		});
		const followed = await member.tags.followed();
		expect(followed.items.map((t) => t.name)).not.toContain(name("a"));
	});

	test("typed errors: UNAUTHORIZED without a session, NOT_FOUND for an unknown Tag", async () => {
		await expect(
			clientAs(null).tags.follow({ tag: name("a") }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		await expect(clientAs(null).tags.followed()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
		await expect(
			clientAs(memberId).tags.follow({ tag: name("nope") }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	test("a `%` in the query matches itself, not everything", async () => {
		const found = await clientAs(null).tags.search({ q: "%", limit: 50 });
		expect(found.items.every((t) => t.name.includes("%"))).toBe(true);
	});
});
