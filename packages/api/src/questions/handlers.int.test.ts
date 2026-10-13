/// <reference types="bun" />
// Integration test of the questions procedures through the router, against a real Postgres (#67):
// each procedure's nominal path and its typed errors, as a client sees them.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { user } from "@codesphere/db/schema/auth";
import { questions } from "@codesphere/db/schema/questions";
import { createRouterClient } from "@orpc/server";
import { inArray } from "drizzle-orm";

import { appRouter } from "../routers";
import { testContext } from "../test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)(
	"questions procedures through the router on Postgres",
	() => {
		const db = createDb({ DATABASE_URL: url ?? "" });
		const run = crypto.randomUUID();
		const author = `it-qh-author-${run}`;
		const other = `it-qh-other-${run}`;
		const admin = `it-qh-admin-${run}`;

		const session = (id: string, role = "member", kind = "human") =>
			({
				user: { id, role, kind },
				session: { id: `s-${id}` },
			}) as unknown as Session;
		const clientAs = (s: Session | null) =>
			createRouterClient(appRouter, {
				context: testContext({ db, session: s }),
			});
		const asAuthor = clientAs(session(author));
		const asOther = clientAs(session(other));
		const asAdmin = clientAs(session(admin, "admin"));
		const anonymous = clientAs(null);

		const created = (overrides = {}) =>
			asAuthor.questions.create({
				idempotencyKey: crypto.randomUUID(),
				title: "How do I index?",
				body: "Use **an index**.",
				language: "en",
				tags: ["sql"],
				...overrides,
			});

		beforeAll(async () => {
			await db.insert(user).values(
				[author, other, admin].map((id) => ({
					id,
					name: id,
					email: `${id}@example.com`,
					role: id === admin ? "admin" : "member",
				})),
			);
		});

		afterAll(async () => {
			await db
				.delete(questions)
				.where(inArray(questions.authorId, [author, other]));
			await db.delete(user).where(inArray(user.id, [author, other, admin]));
		});

		test("create returns the question; without a session it is UNAUTHORIZED", async () => {
			const q = await created();
			expect(q).toMatchObject({ authorId: author, status: "open", version: 1 });
			await expect(
				anonymous.questions.create({
					idempotencyKey: crypto.randomUUID(),
					title: "t",
					body: "b",
					language: "en",
					tags: ["sql"],
				}),
			).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		});

		test("create with no tags is refused as BAD_REQUEST by the contract", async () => {
			await expect(created({ tags: [] })).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});

		test("get returns the question; a missing one is NOT_FOUND", async () => {
			const q = await created();
			expect((await asOther.questions.get({ id: q.id })).id).toBe(q.id);
			await expect(
				asOther.questions.get({ id: crypto.randomUUID() }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		test("update: nominal, stale CONFLICT carrying the current version, FORBIDDEN, NOT_FOUND", async () => {
			const q = await created();
			const updated = await asAuthor.questions.update({
				id: q.id,
				expectedVersion: 1,
				title: "Renamed",
			});
			expect(updated.version).toBe(2);

			await expect(
				asAuthor.questions.update({
					id: q.id,
					expectedVersion: 1,
					title: "Stale",
				}),
			).rejects.toMatchObject({ code: "CONFLICT", data: { version: 2 } });

			await expect(
				asOther.questions.update({
					id: q.id,
					expectedVersion: 2,
					title: "Mine",
				}),
			).rejects.toMatchObject({ code: "FORBIDDEN" });

			await expect(
				asAuthor.questions.update({
					id: crypto.randomUUID(),
					expectedVersion: 1,
					title: "x",
				}),
			).rejects.toMatchObject({ code: "NOT_FOUND" });
		});

		test("close: by the author, by an Admin; FORBIDDEN for others; stale CONFLICT", async () => {
			const q = await created();
			await expect(
				asOther.questions.close({ id: q.id, expectedVersion: 1 }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
			await expect(
				asAuthor.questions.close({ id: q.id, expectedVersion: 9 }),
			).rejects.toMatchObject({
				code: "CONFLICT",
				data: { version: 1 },
			});
			expect(
				(await asAuthor.questions.close({ id: q.id, expectedVersion: 1 }))
					.status,
			).toBe("closed");

			const byAdmin = await created();
			expect(
				(await asAdmin.questions.close({ id: byAdmin.id, expectedVersion: 1 }))
					.status,
			).toBe("closed");
		});

		test("delete: FORBIDDEN for others, stale CONFLICT, then the author deletes and it is NOT_FOUND", async () => {
			const q = await created();
			await expect(
				asOther.questions.delete({ id: q.id, expectedVersion: 1 }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
			await expect(
				asAuthor.questions.delete({ id: q.id, expectedVersion: 9 }),
			).rejects.toMatchObject({
				code: "CONFLICT",
				data: { version: 1 },
			});
			expect(
				await asAuthor.questions.delete({ id: q.id, expectedVersion: 1 }),
			).toEqual({
				success: true,
			});
			await expect(asAuthor.questions.get({ id: q.id })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});
	},
);
