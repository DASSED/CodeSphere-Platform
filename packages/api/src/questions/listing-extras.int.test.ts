/// <reference types="bun" />
// What a feed card needs next to the Question (#66): excerpt, author, Owner and Answer count.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { answers, questions } from "@codesphere/db/schema/questions";
import { inArray } from "drizzle-orm";

import { excerptOf, createListingService } from "./listing";

const url = process.env.TEST_DATABASE_URL;

describe("excerptOf", () => {
	test("drops code fences and Markdown marks, and truncates", () => {
		expect(excerptOf("Use **an index**.\n```sql\nSELECT 1;\n```\nSee [docs](http://x).")).toBe(
			"Use an index . See docs.",
		);
		expect(excerptOf("a".repeat(300))).toHaveLength(181);
	});
});

describe.skipIf(!url)("question list extras on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const owner = `it-lx-owner-${run}`;
	const agent = `it-lx-agent-${run}`;
	const helper = `it-lx-helper-${run}`;
	const ids = [owner, agent, helper];
	const tag = `lx-${run.slice(0, 8)}`;

	beforeAll(async () => {
		await db.insert(user).values([
			{ id: owner, name: "Ada Owner", email: `${owner}@example.com` },
			{
				id: agent,
				name: "Botty",
				email: `${agent}@agents.invalid`,
				kind: "agent",
				ownerId: owner,
				country: "BF",
			},
			{ id: helper, name: "Helper", email: `${helper}@example.com` },
		]);
		const [q] = await db
			.insert(questions)
			.values({
				authorId: agent,
				idempotencyKey: crypto.randomUUID(),
				title: "Agent question",
				body: "How to **index**?",
				bodyHtml: "<p>How to index?</p>",
				language: "en",
				tags: [tag],
			})
			.returning();
		await db.insert(answers).values([
			{
				questionId: q?.id ?? "",
				authorId: helper,
				idempotencyKey: crypto.randomUUID(),
				body: "a",
				bodyHtml: "<p>a</p>",
			},
			{
				questionId: q?.id ?? "",
				authorId: owner,
				idempotencyKey: crypto.randomUUID(),
				body: "b",
				bodyHtml: "<p>b</p>",
			},
		]);
	});

	afterAll(async () => {
		await db.delete(answers).where(inArray(answers.authorId, ids));
		await db.delete(questions).where(inArray(questions.authorId, ids));
		await db.delete(user).where(inArray(user.id, ids));
	});

	test("an Agent's Question carries its Owner, country, excerpt and Answer count", async () => {
		const { items } = await createListingService(db).list({
			tags: [tag],
			sort: "recent",
			limit: 20,
		});
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			authorName: "Botty",
			authorKind: "agent",
			ownerName: "Ada Owner",
			authorCountry: "BF",
			answerCount: 2,
			excerpt: "How to index ?",
		});
	});
});
