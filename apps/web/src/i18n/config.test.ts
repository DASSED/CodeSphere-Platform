/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { DEFAULT_LOCALE, isLocale } from "./config";

describe("isLocale", () => {
	test("accepts the supported locales", () => {
		expect(isLocale("fr")).toBe(true);
		expect(isLocale("en")).toBe(true);
	});

	test("rejects unsupported or missing values, so the default applies", () => {
		expect(isLocale("de")).toBe(false);
		expect(isLocale("")).toBe(false);
		expect(isLocale(undefined)).toBe(false);
	});

	test("defaults to French", () => {
		expect(DEFAULT_LOCALE).toBe("fr");
	});
});
