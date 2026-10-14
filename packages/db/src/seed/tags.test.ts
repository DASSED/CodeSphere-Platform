/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { STARTER_TAGS } from "./tags";
import { testQuestions } from "./test-data";

describe("starter Tags", () => {
	test("are about thirty, unique and normalized", () => {
		expect(STARTER_TAGS.length).toBeGreaterThanOrEqual(25);
		expect(STARTER_TAGS.length).toBeLessThanOrEqual(40);
		expect(new Set(STARTER_TAGS).size).toBe(STARTER_TAGS.length);
		for (const name of STARTER_TAGS as readonly string[]) {
			expect(name).toBe(name.trim().toLowerCase());
			expect(name.length).toBeLessThanOrEqual(40);
		}
	});

	test("include the Tags the spec names", () => {
		for (const name of ["mobile-money", "ussd", "cadev-2026"]) {
			expect(STARTER_TAGS as readonly string[]).toContain(name);
		}
	});
});

describe("test data", () => {
	test("has three Questions whose Tags are starter Tags", () => {
		expect(testQuestions).toHaveLength(3);
		for (const question of testQuestions) {
			for (const name of question.tags) {
				expect(STARTER_TAGS as readonly string[]).toContain(name);
			}
		}
	});
});
