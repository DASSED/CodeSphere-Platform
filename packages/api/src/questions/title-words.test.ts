import { describe, expect, test } from "bun:test";

import { titleWords } from "./listing";

describe("titleWords", () => {
	test("keeps words of 3 characters or more, lowercased and unique, at most 5", () => {
		expect(
			titleWords("How to use an INDEX on a big index table in SQL now please"),
		).toEqual(["how", "use", "index", "big", "table"]);
	});

	test("keeps tech words like c++, c# and node.js", () => {
		expect(titleWords("c++ or c# with node.js")).toEqual([
			"c++",
			"with",
			"node.js",
		]);
	});

	test("LIKE wildcards are separators, never part of a word", () => {
		expect(titleWords("100%_done")).toEqual(["100", "done"]);
	});

	test("nothing to match without a query", () => {
		expect(titleWords(undefined)).toEqual([]);
		expect(titleWords("a b")).toEqual([]);
	});
});
