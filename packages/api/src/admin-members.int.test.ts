/// <reference types="bun" />
// Integration test against a real Postgres (spec §5, #62). Runs only when TEST_DATABASE_URL
// points at a disposable database with the migrations applied (the CI integration job does both).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";
import { isMemberSuspended } from "@codesphere/contract";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { user } from "@codesphere/db/schema/auth";
import { createRouterClient } from "@orpc/server";
import { and, eq, inArray } from "drizzle-orm";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin.members on Postgres (#123)", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const run = crypto.randomUUID();
	const adminId = `it-admin-${run}`;
	const ownerId = `it-owner-${run}`;
	const agentId = `it-agent-${run}`;
	const ids = [adminId, ownerId, agentId];

	const clientAs = (
		id: string,
		role: string,
		kind = "human",
		suspendedAt: Date | null = null,
	) =>
		createRouterClient(appRouter, {
			context: testContext({
				db,
				session: {
					user: { id, role, kind, suspendedAt },
					session: { id: "s1" },
				} as unknown as Session,
			}),
		});
	const admin = () => clientAs(adminId, "admin").admin.members;

	beforeAll(async () => {
		await db.insert(user).values([
			{
				id: adminId,
				name: "IT admin",
				email: `${adminId}@example.com`,
				role: "admin",
			},
			{ id: ownerId, name: `IT owner ${run}`, email: `${ownerId}@example.com` },
			{
				id: agentId,
				name: `IT agent ${run}`,
				email: `${agentId}@agents.example.com`,
				kind: "agent",
				ownerId,
			},
		]);
	});

	afterAll(async () => {
		await db.delete(auditLog).where(inArray(auditLog.actorId, ids));
		await db.delete(user).where(inArray(user.id, ids));
	});

	test("suspends a Member, writes the audit event, and leaves their Agent alone", async () => {
		const member = await admin().suspend({
			id: ownerId,
			reason: "Spam répété",
		});
		expect(member.suspendedAt).not.toBeNull();
		expect(member.suspensionReason).toBe("Spam répété");

		const [event] = await db
			.select()
			.from(auditLog)
			.where(
				and(
					eq(auditLog.actorId, adminId),
					eq(auditLog.action, "member.suspend"),
				),
			);
		expect(event?.targetId).toBe(ownerId);
		expect(event?.details).toEqual({ reason: "Spam répété" });

		const [agent] = await db.select().from(user).where(eq(user.id, agentId));
		expect(agent?.suspendedAt).toBeNull();
	});

	test("suspending an already suspended Member is a CONFLICT", async () => {
		await expect(
			admin().suspend({ id: ownerId, reason: "Encore" }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	test("lists by status and text", async () => {
		const suspended = await admin().list({ status: "suspended", q: run });
		expect(suspended.items.map((m) => m.id)).toEqual([ownerId]);
		const active = await admin().list({ status: "active", q: `agent ${run}` });
		expect(active.items.map((m) => m.id)).toEqual([agentId]);
	});

	test("reactivates, then a second reactivation is a CONFLICT", async () => {
		const member = await admin().reactivate({ id: ownerId });
		expect(member.suspendedAt).toBeNull();
		expect(member.suspensionReason).toBeNull();
		await expect(admin().reactivate({ id: ownerId })).rejects.toMatchObject({
			code: "CONFLICT",
		});
	});

	test("an unknown Member is NOT_FOUND", async () => {
		await expect(
			admin().suspend({ id: `nobody-${run}`, reason: "Inconnu" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	test("an Admin cannot suspend themself", async () => {
		await expect(
			admin().suspend({ id: adminId, reason: "Moi-même" }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("a Member gets FORBIDDEN", async () => {
		await expect(
			clientAs(ownerId, "member").admin.members.suspend({
				id: agentId,
				reason: "Pas Admin",
			}),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	test("a suspended Member keeps reading but every write is refused", async () => {
		const suspended = clientAs(ownerId, "member", "human", new Date());
		const me = await suspended.members.me();
		expect(me.id).toBe(ownerId);
		const refusal = await suspended.members
			.update({ name: "Renamed" })
			.catch((error: unknown) => error);
		expect(isMemberSuspended(refusal)).toBe(true);
	});
});
