/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { hasDatabaseFrom } from "./deployment";

describe("hasDatabaseFrom", () => {
	test("is false only for an explicit false", () => {
		expect(hasDatabaseFrom("false")).toBe(false);
		expect(hasDatabaseFrom("true")).toBe(true);
	});

	test("defaults to a database when the flag is unset (staging, production)", () => {
		expect(hasDatabaseFrom(undefined)).toBe(true);
	});
});
