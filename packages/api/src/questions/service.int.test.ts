/// <reference types="bun" />
// Integration test against a real Postgres (#67): every procedure's nominal path and typed error.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { questions } from "@codesphere/db/schema/questions";
import { eq, inArray } from "drizzle-orm";

import { createQuestionService } from "./service";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("questions service on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const service = createQuestionService(db);
	const run = crypto.randomUUID();
	const author = `it-q-author-${run}`;
	const other = `it-q-other-${run}`;
	const admin = `it-q-admin-${run}`;
	const input = (overrides = {}) => ({
		idempotencyKey: crypto.randomUUID(),
		title: "How do I index?",
		body: "Use **an index**.",
		language: "en" as const,
		tags: ["sql"],
		...overrides,
	});

	beforeAll(async () => {
		await db.insert(user).values(
			[author, other, admin].map((id) => ({
				id,
				name: id,
				email: `${id}@example.com`,
			})),
		);
	});

	afterAll(async () => {
		await db
			.delete(questions)
			.where(inArray(questions.authorId, [author, other]));
		await db.delete(user).where(inArray(user.id, [author, other, admin]));
	});

	test("create returns an open question at version 1 with its Markdown rendered", async () => {
		const q = await service.createQuestion(author, input());
		expect(q).toMatchObject({ authorId: author, status: "open", version: 1 });
		expect(q.bodyHtml).toContain("<strong>an index</strong>");
	});

	test("the same idempotency key from the same author yields one question", async () => {
		const data = input();
		const first = await service.createQuestion(author, data);
		const replay = await service.createQuestion(author, data);
		expect(replay.id).toBe(first.id);
		const rows = await db
			.select({ id: questions.id })
			.from(questions)
			.where(eq(questions.idempotencyKey, data.idempotencyKey));
		expect(rows).toHaveLength(1);
	});

	test("two racing creates with one key yield one question", async () => {
		const data = input();
		const [a, b] = await Promise.all([
			service.createQuestion(author, data),
			service.createQuestion(author, data),
		]);
		expect(a.id).toBe(b.id);
		const rows = await db
			.select({ id: questions.id })
			.from(questions)
			.where(eq(questions.idempotencyKey, data.idempotencyKey));
		expect(rows).toHaveLength(1);
	});

	test("a key reused by another author creates that author's own question", async () => {
		const data = input();
		const mine = await service.createQuestion(author, data);
		const theirs = await service.createQuestion(other, data);
		expect(theirs.id).not.toBe(mine.id);
		expect(theirs.authorId).toBe(other);
	});

	test("known XSS payloads are neutralised in the stored HTML", async () => {
		const q = await service.createQuestion(
			author,
			input({
				body: "<script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>",
			}),
		);
		// The payloads survive only as escaped text: no live tag, no link, no event handler.
		expect(q.bodyHtml).not.toMatch(/<(script|img)\b/i);
		expect(q.bodyHtml).not.toMatch(/href="javascript:/i);
		expect(q.bodyHtml).not.toMatch(/<[a-z]+\s[^>]*\son\w+=/i);
	});

	test("a stale update yields CONFLICT with the current version", async () => {
		const q = await service.createQuestion(author, input());
		await service.updateQuestion(author, {
			id: q.id,
			expectedVersion: 1,
			title: "Renamed",
		});
		await expect(
			service.updateQuestion(author, {
				id: q.id,
				expectedVersion: 1,
				title: "Stale",
			}),
		).rejects.toMatchObject({ code: "CONFLICT", currentVersion: 2 });
	});

	test("an update by someone else is FORBIDDEN", async () => {
		const q = await service.createQuestion(author, input());
		await expect(
			service.updateQuestion(other, {
				id: q.id,
				expectedVersion: 1,
				title: "Mine",
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("close by a non-author non-admin is FORBIDDEN", async () => {
		const q = await service.createQuestion(author, input());
		await expect(
			service.closeQuestion({ id: other, isStaff: false }, q.id, 1),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("close by the author, and by an Admin, succeeds", async () => {
		const byAuthor = await service.createQuestion(author, input());
		const closed = await service.closeQuestion(
			{ id: author, isStaff: false },
			byAuthor.id,
			1,
		);
		expect(closed.status).toBe("closed");

		const byAdmin = await service.createQuestion(author, input());
		const closedByAdmin = await service.closeQuestion(
			{ id: admin, isStaff: true },
			byAdmin.id,
			1,
		);
		expect(closedByAdmin.status).toBe("closed");
	});

	test("get on a missing question is NOT_FOUND", async () => {
		await expect(
			service.getQuestion(crypto.randomUUID()),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	test("a soft-deleted question is NOT_FOUND, and only its author may delete it", async () => {
		const q = await service.createQuestion(author, input());
		await expect(
			service.softDeleteQuestion(other, q.id, 1),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
		await service.softDeleteQuestion(author, q.id, 1);
		await expect(service.getQuestion(q.id)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});
