/// <reference types="bun" />
// Integration test against a real Postgres (#125); skipped without TEST_DATABASE_URL.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { questions } from "@codesphere/db/schema/questions";
import { tag } from "@codesphere/db/schema/tags";
import { createRouterClient } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin.tags on Postgres (#125)", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID().slice(0, 8);
	const adminId = `it-tag-admin-${run}`;
	const name = (suffix: string) => `it-${run}-${suffix}`;
	const clientAs = (role: string) =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: {
					user: { id: adminId, role, kind: "human" },
					session: { id: "s1" },
				} as unknown as Session,
			}),
		});
	const admin = () => clientAs("admin");

	beforeAll(async () => {
		await db.insert(user).values({
			id: adminId,
			name: "IT admin",
			email: `${adminId}@example.com`,
			role: "admin",
		});
	});

	afterAll(async () => {
		await db.delete(questions).where(eq(questions.authorId, adminId));
		await db.delete(auditLog).where(eq(auditLog.actorId, adminId));
		await db
			.delete(tag)
			.where(inArray(tag.name, [name("a"), name("b"), name("c")]));
		await db.delete(user).where(eq(user.id, adminId));
	});

	test("`JavaScript ` and `javascript` give the same Tag", async () => {
		const created = await admin().admin.tags.create({ name: ` ${name("A")} ` });
		expect(created.name).toBe(name("a"));
		await expect(
			admin().admin.tags.create({ name: name("a") }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	test("rename collides with another Tag's normalized name", async () => {
		const a = (await admin().admin.tags.list({})).items.find(
			(t) => t.name === name("a"),
		);
		const b = await admin().admin.tags.create({ name: name("b") });
		await expect(
			admin().admin.tags.rename({
				id: b.id,
				name: name("A"),
				expectedVersion: b.version,
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
		const renamed = await admin().admin.tags.rename({
			id: b.id,
			name: name("c"),
			expectedVersion: b.version,
		});
		expect(renamed).toMatchObject({ name: name("c"), version: 2 });
		expect(a).toBeDefined();
	});

	test("a Tag used by a Question cannot be deleted", async () => {
		const used = (await admin().admin.tags.list({})).items.find(
			(t) => t.name === name("a"),
		);
		await db.insert(questions).values({
			authorId: adminId,
			idempotencyKey: crypto.randomUUID(),
			title: "t",
			body: "b",
			bodyHtml: "<p>b</p>",
			language: "fr",
			tags: [name("a")],
		});
		await expect(
			admin().admin.tags.delete({ id: used?.id ?? "" }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	test("renaming a used Tag moves its Questions with it", async () => {
		const t = await admin().admin.tags.create({ name: name("d") });
		const [q] = await db
			.insert(questions)
			.values({
				authorId: adminId,
				idempotencyKey: crypto.randomUUID(),
				title: "t",
				body: "b",
				bodyHtml: "<p>b</p>",
				language: "fr",
				tags: [name("d")],
			})
			.returning({ id: questions.id });
		const renamed = await admin().admin.tags.rename({
			id: t.id,
			name: name("e"),
			expectedVersion: t.version,
		});
		expect(renamed.questionCount).toBe(1);
		const [after] = await db
			.select({ tags: questions.tags })
			.from(questions)
			.where(eq(questions.id, q?.id ?? ""));
		expect(after?.tags).toEqual([name("e")]);
		await db.delete(tag).where(eq(tag.id, t.id));
	});

	test("the Hackathon's Tag is protected, a non-admin is FORBIDDEN", async () => {
		const owned = (await admin().admin.tags.list({})).items.find(
			(t) => t.name === "cadev-2026",
		);
		if (owned) {
			expect(owned.ownerHackathon).toBe("cadev-2026");
			await expect(
				admin().admin.tags.delete({ id: owned.id }),
			).rejects.toMatchObject({ code: "CONFLICT" });
		}
		await expect(clientAs("member").admin.tags.list({})).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});
});
