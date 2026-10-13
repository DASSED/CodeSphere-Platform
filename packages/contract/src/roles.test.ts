import { describe, expect, test } from "bun:test";

import { isStaffRole, outranks, rolesBelow, staffRank } from "./roles";

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

	test("rolesBelow lists the roles an actor may moderate", () => {
		expect(rolesBelow("super_admin").sort()).toEqual(
			["admin", "member", "moderator"].sort(),
		);
		expect(rolesBelow("admin").sort()).toEqual(["member", "moderator"].sort());
		expect(rolesBelow("moderator")).toEqual(["member"]);
		expect(rolesBelow("member")).toEqual(["member"]);
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
