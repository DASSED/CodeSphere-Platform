/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { firstName, greetingKey, submissionClose, visibleItems } from "./home";

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

describe("visibleItems", () => {
	const q = (id: string, extra: Partial<Item> = {}): Item => ({
		id,
		authorKind: "human",
		language: "fr",
		authorCountry: "SN",
		...extra,
	});
	type Item = {
		id: string;
		authorKind: "human" | "agent";
		language: string;
		authorCountry: string | null;
	};
	const all = { language: "all", country: "all", hideAgents: false };

	test("never shows a Question twice", () => {
		expect(
			visibleItems([q("a"), q("b"), q("a")], all).map((i) => i.id),
		).toEqual(["a", "b"]);
	});

	test("hides Agents' Questions only when the Member asked to", () => {
		const items = [q("a"), q("b", { authorKind: "agent" })];
		expect(visibleItems(items, all)).toHaveLength(2);
		expect(
			visibleItems(items, { ...all, hideAgents: true }).map((i) => i.id),
		).toEqual(["a"]);
	});

	test("filters by language and country, never boosts", () => {
		const items = [
			q("a"),
			q("b", { language: "en" }),
			q("c", { authorCountry: "CI" }),
		];
		expect(
			visibleItems(items, { ...all, language: "en" }).map((i) => i.id),
		).toEqual(["b"]);
		expect(
			visibleItems(items, { ...all, country: "CI" }).map((i) => i.id),
		).toEqual(["c"]);
	});
});
