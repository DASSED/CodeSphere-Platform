import { describe, expect, test } from "bun:test";

import {
	DEFAULT_ROLE,
	isStaffRole,
	outranks,
	ROLES,
	rolesBelow,
	STAFF_ROLES,
	staffRank,
} from "./roles";

describe("ROLES", () => {
	test("is the default role then every staff role, lowest rank first", () => {
		expect([...ROLES]).toEqual([
			DEFAULT_ROLE,
			"moderator",
			"admin",
			"super_admin",
		]);
		expect(ROLES.map(staffRank)).toEqual([0, 1, 2, 3]);
	});

	test("every staff role is a role", () => {
		for (const role of STAFF_ROLES) {
			expect(ROLES).toContain(role);
		}
	});
});

describe("staff rank", () => {
	test("super_admin > admin > moderator > member", () => {
		expect(staffRank("super_admin")).toBeGreaterThan(staffRank("admin"));
		expect(staffRank("admin")).toBeGreaterThan(staffRank("moderator"));
		expect(staffRank("moderator")).toBeGreaterThan(staffRank("member"));
	});

	test("an unknown role or none is a plain Member", () => {
		for (const role of [undefined, null, "", "owner", 3]) {
			expect(staffRank(role)).toBe(0);
		}
	});

	test("only a strictly higher rank outranks", () => {
		expect(outranks("super_admin", "admin")).toBe(true);
		expect(outranks("admin", "moderator")).toBe(true);
		expect(outranks("moderator", "member")).toBe(true);
		expect(outranks("moderator", "admin")).toBe(false);
		expect(outranks("admin", "admin")).toBe(false);
		expect(outranks("admin", "super_admin")).toBe(false);
		expect(outranks("member", "member")).toBe(false);
	});

	const below = (actor: string): string[] => rolesBelow(actor);

	test("rolesBelow lists the roles an actor may moderate", () => {
		expect(below("super_admin").sort()).toEqual(
			["admin", "member", "moderator"].sort(),
		);
		expect(below("admin").sort()).toEqual(["member", "moderator"].sort());
		expect(below("moderator")).toEqual(["member"]);
		expect(below("member")).toEqual(["member"]);
	});

	test("every role below an actor is one the actor outranks", () => {
		for (const actor of ["super_admin", "admin", "moderator"]) {
			for (const role of rolesBelow(actor)) {
				expect(outranks(actor, role)).toBe(true);
			}
			expect(isStaffRole(actor)).toBe(true);
		}
	});
});
