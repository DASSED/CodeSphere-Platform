import { describe, expect, test } from "bun:test";
import { ROLES, STAFF_ROLES } from "@codesphere/contract/roles";

import { roles } from "./access";

const can = (role: keyof typeof roles, permissions: Record<string, string[]>) =>
	roles[role].authorize(permissions as never).success;

describe("access control", () => {
	test("defines exactly the roles of the database enum", () => {
		expect(Object.keys(roles).sort()).toEqual([...ROLES].sort());
	});

	test("a plain Member reaches nothing of the back-office", () => {
		expect(can("member", { moderation: ["list"] })).toBe(false);
		expect(can("member", { audit: ["read"] })).toBe(false);
		expect(can("member", { user: ["list"] })).toBe(false);
	});

	test("every staff role reaches the back-office resources", () => {
		for (const role of STAFF_ROLES) {
			expect(can(role, { moderation: ["list", "suspend", "reactivate"] })).toBe(
				true,
			);
			expect(can(role, { tag: ["create", "rename", "delete"] })).toBe(true);
			expect(can(role, { hackathon: ["update"] })).toBe(true);
			expect(can(role, { audit: ["read"], kpi: ["read"] })).toBe(true);
		}
	});

	test("no role may bypass the email lists or the audited suspension", () => {
		for (const role of ROLES) {
			for (const action of [
				"set-role",
				"ban",
				"impersonate",
				"delete",
				"set-password",
			]) {
				expect(can(role, { user: [action] })).toBe(false);
			}
			expect(can(role, { session: ["revoke"] })).toBe(false);
		}
	});
});
