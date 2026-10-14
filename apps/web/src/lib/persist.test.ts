import { describe, expect, test } from "bun:test";

import { isPersisted, PERSISTED_PAGES, trimPages } from "./persist";

describe("isPersisted", () => {
	test("keeps the feed, opened Questions and Answers, CADEV, followed Tags and the profile", () => {
		for (const path of [
			["feed", "forYou"],
			["questions", "list"],
			["questions", "get"],
			["answers", "list"],
			["hackathons", "get"],
			["tags", "followed"],
			["members", "me"],
		]) {
			expect(isPersisted([path, { type: "query" }])).toBe(true);
		}
	});

	test("keeps nothing else: export, previews, admin, searches", () => {
		for (const path of [
			["members", "export"],
			["markdown", "preview"],
			["admin", "members", "list"],
			["tags", "search"],
			["agents", "list"],
		]) {
			expect(isPersisted([path, { type: "query" }])).toBe(false);
		}
		expect(isPersisted(["not-orpc"])).toBe(false);
	});
});

describe("trimPages", () => {
	test("an infinite query keeps its first pages only", () => {
		const data = {
			pages: [1, 2, 3, 4],
			pageParams: [undefined, "a", "b", "c"],
		};
		expect(trimPages(data)).toEqual({
			pages: [1, 2].slice(0, PERSISTED_PAGES),
			pageParams: [undefined, "a"],
		});
	});

	test("other data is kept whole", () => {
		const data = { id: "q", title: "t" };
		expect(trimPages(data)).toBe(data);
		expect(trimPages(null)).toBeNull();
	});
});
