/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { signInErrorKey } from "./sign-in-error";

describe("signInErrorKey", () => {
	test("has nothing to say without an error", () => {
		expect(signInErrorKey(null)).toBeNull();
	});

	test("explains a refused account creation as missing consent", () => {
		expect(signInErrorKey("unable_to_create_user")).toBe("consentRequired");
	});

	test("falls back to a generic failure for any other error", () => {
		expect(signInErrorKey("access_denied")).toBe("failed");
	});
});
