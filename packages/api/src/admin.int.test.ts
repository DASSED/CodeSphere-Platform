/// <reference types="bun" />
// Integration test against a real Postgres (spec §5, #62). Runs only when TEST_DATABASE_URL
// points at a disposable database with the schema pushed (the CI integration job does both).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin.auditLog.list on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const adminId = `it-admin-${crypto.randomUUID()}`;

	const clientAs = (role: string, kind = "human") =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: {
					user: { id: adminId, role, kind },
					session: { id: "s1" },
				} as unknown as Session,
			}),
		});

	beforeAll(async () => {
		await db.insert(user).values({
			id: adminId,
			name: "Integration admin",
			email: `${adminId}@example.com`,
			role: "admin",
		});
		await db.insert(auditLog).values({
			actorId: adminId,
			action: "it.check",
			targetType: "test",
		});
		// Three events in the same millisecond: paging must break the tie on id (#122).
		const at = new Date();
		await db.insert(auditLog).values(
			[1, 2, 3].map(() => ({
				actorId: adminId,
				action: "it.page",
				targetType: "test",
				createdAt: at,
			})),
		);
	});

	afterAll(async () => {
		await db.delete(auditLog).where(eq(auditLog.actorId, adminId));
		await db.delete(user).where(eq(user.id, adminId));
	});

	test("an admin reads the newest audit events", async () => {
		const page = await clientAs("admin").admin.auditLog.list({ limit: 5 });
		expect(page.items.some((event) => event.action === "it.check")).toBe(true);
	});

	test("a member gets FORBIDDEN", async () => {
		await expect(
			clientAs("member").admin.auditLog.list({ limit: 5 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("an Agent with the admin role forced in the database gets FORBIDDEN", async () => {
		await expect(
			clientAs("admin", "agent").admin.auditLog.list({ limit: 5 }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("pages through filtered events without losing or repeating one", async () => {
		const list = clientAs("admin").admin.auditLog.list;
		const filter = { actorId: adminId, action: "it.page", limit: 2 };
		const first = await list(filter);
		expect(first.items).toHaveLength(2);
		expect(first.nextCursor).not.toBeNull();
		const second = await list({ ...filter, cursor: first.nextCursor ?? "" });
		expect(second.items).toHaveLength(1);
		expect(second.nextCursor).toBeNull();
		const ids = [...first.items, ...second.items].map((event) => event.id);
		expect(new Set(ids).size).toBe(3);
	});

	test("a cursor it did not issue gets BAD_REQUEST", async () => {
		await expect(
			clientAs("admin").admin.auditLog.list({ limit: 5, cursor: "nope" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});
