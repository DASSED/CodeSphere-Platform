/// <reference types="bun" />
// Integration test against a real Postgres (spec §5, #62). Runs only when TEST_DATABASE_URL
// points at a disposable database with the schema pushed (the CI integration job does both).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { createLogger } from "@codesphere/logger";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";

import { appRouter } from "./routers";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin.auditLog.list on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const adminId = `it-admin-${crypto.randomUUID()}`;

	const clientAs = (role: string) =>
		createRouterClient(appRouter, {
			context: {
				db,
				logger: createLogger({ level: "silent" }),
				requestId: "it",
				session: {
					user: { id: adminId, role },
					session: { id: "s1" },
				} as unknown as Session,
			},
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
});
