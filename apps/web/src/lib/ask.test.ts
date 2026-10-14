import { describe, expect, test } from "bun:test";

import {
	fieldError,
	prefilled,
	type QuestionDraft,
	stepErrors,
	stepOf,
} from "./ask";

const draft: QuestionDraft = {
	title: "How do I index?",
	body: "Details",
	tags: ["sql"],
	language: "en",
	idempotencyKey: "k",
};

describe("ask form rules", () => {
	test("a complete draft has no error on any step", () => {
		for (const step of ["title", "details", "tags", "review"] as const) {
			expect(stepErrors(draft, step)).toEqual({});
		}
	});

	test("each field reports its own error", () => {
		expect(fieldError({ ...draft, title: "  " }, "title")).toBe("required");
		expect(fieldError({ ...draft, title: "x".repeat(201) }, "title")).toBe(
			"tooLong",
		);
		expect(fieldError({ ...draft, body: "" }, "body")).toBe("required");
		expect(fieldError({ ...draft, body: "x".repeat(20_001) }, "body")).toBe(
			"tooLong",
		);
		expect(fieldError({ ...draft, tags: [] }, "tags")).toBe("required");
		expect(
			fieldError({ ...draft, tags: ["a", "b", "c", "d", "e", "f"] }, "tags"),
		).toBe("tooManyTags");
	});

	test("a step only checks its fields; the review checks them all", () => {
		const empty = { ...draft, title: "", body: "", tags: [] };
		expect(stepErrors(empty, "title")).toEqual({ title: "required" });
		expect(stepErrors(empty, "details")).toEqual({ body: "required" });
		expect(stepErrors(empty, "review")).toEqual({
			title: "required",
			body: "required",
			tags: "required",
		});
	});

	test("a server error on a field goes back to its step", () => {
		expect(stepOf("title")).toBe(0);
		expect(stepOf("body")).toBe(1);
		expect(stepOf("tags")).toBe(2);
		expect(stepOf("unknown")).toBe(0);
	});

	test("the Hackathon page pre-fills its Tag once", () => {
		expect(prefilled({ ...draft, tags: [] }, "CADEV-2026").tags).toEqual([
			"cadev-2026",
		]);
		expect(prefilled(draft, "sql").tags).toEqual(["sql"]);
		expect(prefilled(draft, null)).toBe(draft);
	});
});
