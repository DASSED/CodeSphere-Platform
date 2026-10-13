import { describe, expect, test } from "bun:test";

import { type AdminMemberRow, adminMember } from "./admin-members";

const row = (role: string | null) =>
	({
		id: "u1",
		name: "N",
		email: "n@example.com",
		kind: "human",
		ownerId: null,
		role,
		createdAt: new Date("2026-10-13T00:00:00.000Z"),
		suspendedAt: null,
		suspensionReason: null,
	}) as unknown as AdminMemberRow;

describe("adminMember role", () => {
	test("each staff role is reported as itself, not folded into member", () => {
		for (const role of ["super_admin", "admin", "moderator"]) {
			expect(adminMember(row(role)).role).toBe(role as "admin");
		}
	});

	test("anything else, or no role, is a member", () => {
		for (const role of ["member", "owner", "", null]) {
			expect(adminMember(row(role)).role).toBe("member");
		}
	});
});
