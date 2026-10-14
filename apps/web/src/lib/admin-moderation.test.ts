/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import type {
	AdminMember as AdminMemberSchema,
	AuditEvent as AuditEventSchema,
} from "@codesphere/contract";
import type { z } from "zod";

type AdminMember = z.infer<typeof AdminMemberSchema>;
type AuditEvent = z.infer<typeof AuditEventSchema>;

import {
	auditEntryOf,
	canModerate,
	memberGroup,
	moderationErrorKey,
} from "./admin-moderation";

const member = (over: Partial<AdminMember> = {}): AdminMember => ({
	id: "u1",
	name: "Awa",
	kind: "human",
	ownerId: null,
	email: "awa@example.com",
	role: "member",
	createdAt: "2026-10-01T00:00:00.000Z",
	suspendedAt: null,
	suspensionReason: null,
	...over,
});

describe("memberGroup", () => {
	test("puts a suspended Member first, then agents, then actives", () => {
		expect(
			memberGroup(member({ suspendedAt: "2026-10-02T00:00:00.000Z" })),
		).toBe("suspended");
		expect(memberGroup(member({ kind: "agent" }))).toBe("agents");
		expect(memberGroup(member())).toBe("active");
	});
});

describe("canModerate", () => {
	test("refuses to suspend oneself and says why", () => {
		expect(canModerate(member({ id: "me" }), "me")).toEqual({
			ok: false,
			reason: "self",
		});
	});

	test("refuses a Member of equal or higher rank", () => {
		expect(canModerate(member({ role: "admin" }), "me", "admin")).toEqual({
			ok: false,
			reason: "rank",
		});
		expect(canModerate(member({ role: "admin" }), "me", "moderator").ok).toBe(
			false,
		);
		expect(canModerate(member(), "me", "moderator")).toEqual({ ok: true });
	});
});

describe("moderationErrorKey", () => {
	test("maps typed errors, falling back to generic", () => {
		expect(moderationErrorKey({ code: "FORBIDDEN" })).toBe("forbidden");
		expect(moderationErrorKey({ code: "CONFLICT" })).toBe("conflict");
		expect(moderationErrorKey(new Error("boom"))).toBe("generic");
	});
});

describe("auditEntryOf", () => {
	const event: AuditEvent = {
		id: "e1",
		actorId: "a1",
		action: "member.suspend",
		targetType: "member",
		targetId: "u1",
		details: { reason: "spam" },
		createdAt: "2026-10-12T14:32:00.000Z",
	};

	test("names the actor and target from the lookup, keeps the reason", () => {
		const entry = auditEntryOf(
			event,
			(id) => (id === "a1" ? "Admin" : "Awa"),
			(iso) => iso,
			"Système",
		);
		expect(entry).toMatchObject({
			id: "e1",
			actor: "Admin",
			action: "member.suspend",
			target: "Awa",
			reason: "spam",
			tone: "destructive",
		});
	});

	test("falls back to the raw id and a system actor", () => {
		const entry = auditEntryOf(
			{ ...event, actorId: null, details: null },
			() => undefined,
			(iso) => iso,
			"Système",
		);
		expect(entry.actor).toBe("Système");
		expect(entry.target).toBe("member u1");
		expect(entry.reason).toBeUndefined();
	});
});
