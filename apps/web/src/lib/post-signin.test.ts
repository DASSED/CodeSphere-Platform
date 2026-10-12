/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { postSignInPath } from "./post-signin";

describe("postSignInPath", () => {
	test("sends a visitor back to the sign-in page", () => {
		expect(postSignInPath(null)).toBe("/signin");
	});

	test("sends an Admin to the back-office", () => {
		expect(postSignInPath({ role: "admin" })).toBe("/admin");
	});

	test("sends any other Member home", () => {
		expect(postSignInPath({ role: "member" })).toBe("/");
		expect(postSignInPath({})).toBe("/");
	});
});
