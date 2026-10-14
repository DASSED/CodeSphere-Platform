/// <reference types="bun" />
// Integration test of members.export through the router, against a real Postgres (#52).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { apikey, user } from "@codesphere/db/schema/auth";
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
		await db.insert(votes).values({
			userId: me,
			targetType: "question",
			targetId: questionId,
			value: 1,
		});
	});

	afterAll(async () => {
		const agents = await db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.ownerId, ids));
		const agentIds = agents.map((a) => a.id);
		if (agentIds.length > 0) {
			await db.delete(apikey).where(inArray(apikey.referenceId, agentIds));
			await db.delete(user).where(inArray(user.id, agentIds));
		}
		await db.delete(auditLog).where(inArray(auditLog.actorId, ids));
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

	test("lists the caller's agents without their key", async () => {
		const { agent, key } = await clientAs(me).agents.create({
			name: "exported",
			preset: "read",
		});
		const data = await clientAs(me).members.export();
		expect(data.agents).toMatchObject([{ id: agent.id, name: "exported" }]);
		const [stored] = await db
			.select({ hash: apikey.key, start: apikey.start })
			.from(apikey)
			.where(inArray(apikey.referenceId, [agent.id]));
		const text = JSON.stringify(data);
		expect(text).not.toContain(key);
		expect(text).not.toContain(stored?.hash ?? "missing");
		expect(text).not.toContain("cs_live_");
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
