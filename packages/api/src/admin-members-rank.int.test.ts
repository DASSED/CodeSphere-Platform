/// <reference types="bun" />
// A staff member can only moderate a Member of strictly lower rank (#123): integration test
// against a real Postgres, through the router.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import type { Role } from "@codesphere/contract/roles";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { createRouterClient } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("moderation rank on Postgres (#123)", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const id = (role: string) => `it-rank-${role}-${run}`;
	const roles = ["super_admin", "admin", "peer_admin", "moderator", "member"];
	const dbRole = (role: string): Role =>
		role === "peer_admin" ? "admin" : (role as Role);
	const ids = roles.map(id);

	const as = (role: string) =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: {
					user: {
						id: id(role),
						role: dbRole(role),
						kind: "human",
						suspendedAt: null,
					},
					session: { id: `s-${role}` },
				} as unknown as Session,
			}),
		}).admin.members;

	const suspendedAt = async (role: string) => {
		const [row] = await db
			.select({ at: user.suspendedAt })
			.from(user)
			.where(eq(user.id, id(role)));
		return row?.at ?? null;
	};

	beforeAll(async () => {
		await db.insert(user).values(
			roles.map((role) => ({
				id: id(role),
				name: `IT ${role}`,
				email: `${id(role)}@example.com`,
				role: dbRole(role),
			})),
		);
	});

	afterAll(async () => {
		await db.delete(auditLog).where(inArray(auditLog.actorId, ids));
		await db.delete(user).where(inArray(user.id, ids));
	});

	test("a moderator cannot suspend an admin, and nothing is written", async () => {
		await expect(
			as("moderator").suspend({ id: id("admin"), reason: "Test de rang" }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(await suspendedAt("admin")).toBeNull();
	});

	test("an admin cannot suspend a peer admin nor a super_admin", async () => {
		await expect(
			as("admin").suspend({ id: id("peer_admin"), reason: "Test de rang" }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(
			as("admin").suspend({ id: id("super_admin"), reason: "Test de rang" }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(await suspendedAt("peer_admin")).toBeNull();
		expect(await suspendedAt("super_admin")).toBeNull();
	});

	test("a moderator can suspend a plain Member and reactivate them", async () => {
		const suspended = await as("moderator").suspend({
			id: id("member"),
			reason: "Spam répété",
		});
		expect(suspended.suspendedAt).not.toBeNull();
		const back = await as("moderator").reactivate({ id: id("member") });
		expect(back.suspendedAt).toBeNull();
	});

	test("a super_admin can suspend an admin, and a moderator cannot reactivate them", async () => {
		await as("super_admin").suspend({
			id: id("admin"),
			reason: "Compte compromis",
		});
		expect(await suspendedAt("admin")).not.toBeNull();
		await expect(
			as("moderator").reactivate({ id: id("admin") }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(await suspendedAt("admin")).not.toBeNull();
		const back = await as("super_admin").reactivate({ id: id("admin") });
		expect(back.suspendedAt).toBeNull();
	});

	test("an unknown id is NOT_FOUND, not FORBIDDEN", async () => {
		await expect(
			as("moderator").suspend({ id: `missing-${run}`, reason: "Introuvable" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
