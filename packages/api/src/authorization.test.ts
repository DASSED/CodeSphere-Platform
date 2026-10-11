/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";

import { requireAdmin } from "./authorization";

function sessionWith(role?: string): Session {
	return {
		user: { id: "u1", name: "Ada", role, email: "ada@example.com" },
		session: { id: "s1" },
	} as unknown as Session;
}

describe("requireAdmin", () => {
	test("requires a session", () => {
		expect(requireAdmin(null)).toEqual({ ok: false, code: "UNAUTHORIZED" });
	});

	test("rejects a member", () => {
		expect(requireAdmin(sessionWith("member"))).toEqual({
			ok: false,
			code: "FORBIDDEN",
		});
	});

	test("rejects an agent", () => {
		expect(requireAdmin(sessionWith("agent"))).toEqual({
			ok: false,
			code: "FORBIDDEN",
		});
	});

	test("rejects a user without a role", () => {
		expect(requireAdmin(sessionWith(undefined))).toEqual({
			ok: false,
			code: "FORBIDDEN",
		});
	});

	test("allows an admin", () => {
		expect(requireAdmin(sessionWith("admin"))).toEqual({
			ok: true,
			role: "admin",
		});
	});
});
