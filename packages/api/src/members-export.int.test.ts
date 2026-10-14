/// <reference types="bun" />
// Integration test of members.export through the router, against a real Postgres (#52).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { answers, questions, votes } from "@codesphere/db/schema/questions";
import { createRouterClient } from "@orpc/server";
import { inArray } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("members.export on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const me = `it-ex-me-${run}`;
	const peer = `it-ex-peer-${run}`;
	const ids = [me, peer];

	const clientAs = (id: string | null, kind = "human") =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: id
					? ({
							user: { id, role: "member", kind },
							session: { id: `s-${id}` },
						} as unknown as Session)
					: null,
			}),
		});

	let questionId = "";

	beforeAll(async () => {
		await db.insert(user).values(
			ids.map((id) => ({
				id,
				name: id,
				email: `${id}@example.com`,
			})),
		);
		const [q] = await db
			.insert(questions)
			.values({
				authorId: peer,
				idempotencyKey: crypto.randomUUID(),
				title: "Peer question",
				body: "b",
				bodyHtml: "<p>b</p>",
				language: "en",
				tags: ["sql"],
			})
			.returning();
		questionId = q?.id ?? "";
		await db.insert(answers).values({
			questionId,
			authorId: me,
			idempotencyKey: crypto.randomUUID(),
			body: "my answer",
			bodyHtml: "<p>my answer</p>",
		});
		await db
			.insert(votes)
			.values({
				userId: me,
				targetType: "question",
				targetId: questionId,
				value: 1,
			});
	});

	afterAll(async () => {
		await db.delete(votes).where(inArray(votes.userId, ids));
		await db.delete(answers).where(inArray(answers.authorId, ids));
		await db.delete(questions).where(inArray(questions.authorId, ids));
		await db.delete(user).where(inArray(user.id, ids));
	});

	test("returns the caller's own data and nothing of anyone else's", async () => {
		const data = await clientAs(me).members.export();
		expect(data.profile).toMatchObject({ id: me, email: `${me}@example.com` });
		expect(data.answers.map((a) => a.body)).toEqual(["my answer"]);
		expect(data.votes).toMatchObject([
			{ targetType: "question", targetId: questionId, value: "up" },
		]);
		expect(data.questions).toEqual([]);
	});

	test("is UNAUTHORIZED for a visitor and FORBIDDEN for an Agent", async () => {
		await expect(clientAs(null).members.export()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
		await expect(clientAs(me, "agent").members.export()).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});
});
