/// <reference types="bun" />
// Integration test against a real Postgres (#61); skipped without TEST_DATABASE_URL.
import { describe, expect, test } from "bun:test";
import { count, inArray } from "drizzle-orm";

import { createDb } from "../index";
import { user } from "../schema/auth";
import { questions } from "../schema/questions";
import { tag } from "../schema/tags";
import { seed } from "./seed";
import { STARTER_TAGS } from "./tags";
import { seedTestData, TEST_AGENT_ID, TEST_HUMAN_ID } from "./test-data";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("seed on Postgres (#61)", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });

	test("the starting values replay without duplicates", async () => {
		await seed(db);
		const [before] = await db.select({ n: count() }).from(tag);
		const again = await seed(db);
		const [after] = await db.select({ n: count() }).from(tag);
		expect(after?.n).toBe(before?.n);
		expect(again.tags.created).toBe(0);
		const names = await db
			.select({ name: tag.name })
			.from(tag)
			.where(inArray(tag.name, [...STARTER_TAGS]));
		expect(names).toHaveLength(STARTER_TAGS.length);
	});

	test("the test data is one human, one agent and three Questions, replayable", async () => {
		await seedTestData(db);
		await seedTestData(db);
		const users = await db
			.select({ id: user.id, kind: user.kind, ownerId: user.ownerId })
			.from(user)
			.where(inArray(user.id, [TEST_HUMAN_ID, TEST_AGENT_ID]));
		expect(users).toHaveLength(2);
		expect(users.find((u) => u.id === TEST_AGENT_ID)).toMatchObject({
			kind: "agent",
			ownerId: TEST_HUMAN_ID,
		});
		const authored = await db
			.select({ id: questions.id })
			.from(questions)
			.where(inArray(questions.authorId, [TEST_HUMAN_ID, TEST_AGENT_ID]));
		expect(authored).toHaveLength(3);
	});
});
