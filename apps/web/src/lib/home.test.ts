/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { firstName, greetingKey, submissionClose } from "./home";

describe("submissionClose", () => {
	test("is the start of the submission_close Milestone", () => {
		expect(
			submissionClose([
				{ key: "jury", startsAt: "2026-11-01T00:00:00.000Z" },
				{ key: "submission_close", startsAt: "2026-10-25T17:00:00.000Z" },
			]),
		).toBe("2026-10-25T17:00:00.000Z");
	});

	test("falls back to the first Milestone, then to nothing", () => {
		expect(
			submissionClose([{ key: "jury", startsAt: "2026-11-01T00:00:00.000Z" }]),
		).toBe("2026-11-01T00:00:00.000Z");
		expect(submissionClose([])).toBeNull();
	});
});

describe("greetingKey", () => {
	test("says good morning before 18:00 and good evening after", () => {
		expect(greetingKey(9)).toBe("morning");
		expect(greetingKey(17)).toBe("morning");
		expect(greetingKey(18)).toBe("evening");
	});
});

describe("firstName", () => {
	test("keeps the first word of the display name", () => {
		expect(firstName("Dave Daydy")).toBe("Dave");
		expect(firstName("  ")).toBe("");
	});
});
