/// <reference types="bun" />
// The offline answer, end to end against the real API on Postgres (#49, #74): the network drops,
// the Member answers, the network returns, and the Answer is published exactly once, even when
// the server wrote it but the response was lost on the way back.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { appRouter } from "@codesphere/api/routers/index";
import { testContext } from "@codesphere/api/test-context";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { answers, questions } from "@codesphere/db/schema/questions";
import { createRouterClient } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";

import { flush, newEntry, type OutboxAction, type OutboxEntry } from "./outbox";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("outbox against the API on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const asker = `it-ob-asker-${run}`;
	const helper = `it-ob-helper-${run}`;
	const clientAs = (id: string) =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: {
					user: { id, role: "member", kind: "human" },
					session: { id: `s-${id}` },
				} as unknown as Session,
			}),
		});
	let questionId = "";

	beforeAll(async () => {
		await db.insert(user).values(
			[asker, helper].map((id) => ({
				id,
				name: id,
				email: `${id}@example.com`,
			})),
		);
		questionId = (
			await clientAs(asker).questions.create({
				idempotencyKey: crypto.randomUUID(),
				title: "Offline question",
				body: "Body",
				language: "fr",
				tags: ["sql"],
			})
		).id;
	});

	afterAll(async () => {
		await db.delete(answers).where(inArray(answers.authorId, [asker, helper]));
		await db.delete(questions).where(eq(questions.authorId, asker));
		await db.delete(user).where(inArray(user.id, [asker, helper]));
	});

	test("answer offline, network back, response lost once: one Answer", async () => {
		const api = clientAs(helper);
		let network = false;
		let loseNextResponse = true;
		// The same calls the web app's outbox makes, behind a network that can fail.
		const send = async (action: OutboxAction) => {
			if (!network) {
				throw new TypeError("Failed to fetch");
			}
			if (action.kind !== "answer.create") {
				throw new Error("unexpected action");
			}
			const result = await api.answers.create(action.input);
			if (loseNextResponse) {
				loseNextResponse = false;
				throw new TypeError("network lost after the write");
			}
			return result;
		};
		const clock = { now: 0 };
		const options = { now: () => clock.now, online: () => network };

		let entries: OutboxEntry[] = [
			newEntry(
				{
					kind: "answer.create",
					input: {
						idempotencyKey: crypto.randomUUID(),
						questionId,
						body: "Answered from the bus, offline.",
					},
				},
				0,
			),
		];
		entries = await flush(entries, send, options);
		expect(entries[0]?.state).toBe("pending");

		network = true;
		for (const at of [60_000, 120_000, 180_000]) {
			clock.now = at;
			entries = await flush(entries, send, options);
		}
		expect(entries[0]?.state).toBe("sent");

		const stored = await db
			.select()
			.from(answers)
			.where(eq(answers.questionId, questionId));
		expect(stored).toHaveLength(1);
		expect(stored[0]?.authorId).toBe(helper);
	});

	test("a second distinct Answer is rejected as CONFLICT, never retried", async () => {
		let calls = 0;
		const send = async (action: OutboxAction) => {
			calls++;
			if (action.kind !== "answer.create") {
				throw new Error("unexpected action");
			}
			return clientAs(helper).answers.create(action.input);
		};
		let entries = await flush(
			[
				newEntry(
					{
						kind: "answer.create",
						input: {
							idempotencyKey: crypto.randomUUID(),
							questionId,
							body: "A second answer",
						},
					},
					0,
				),
			],
			send,
			{ now: () => 1, online: () => true },
		);
		entries = await flush(entries, send, {
			now: () => 600_000,
			online: () => true,
		});
		expect(calls).toBe(1);
		expect(entries[0]).toMatchObject({ state: "rejected", reason: "CONFLICT" });
	});
});
