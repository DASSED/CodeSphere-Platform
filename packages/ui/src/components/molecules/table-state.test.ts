/// <reference types="bun" />
// The headless table state (#131 follow-up): sort cycle, page selection, pagination bounds.
import { describe, expect, test } from "bun:test";

import {
	ariaSort,
	clampPage,
	NO_SELECTION,
	nextSort,
	pageRange,
	pageSelectionState,
	pruneSelection,
	togglePage,
	toggleRow,
} from "./table-state";

describe("sort", () => {
	test("cycles ascending → descending → unsorted", () => {
		const asc = nextSort(null, "name");
		expect(asc).toEqual({ key: "name", direction: "asc" });
		const desc = nextSort(asc, "name");
		expect(desc).toEqual({ key: "name", direction: "desc" });
		expect(nextSort(desc, "name")).toBeNull();
	});

	test("another column starts ascending", () => {
		expect(nextSort({ key: "name", direction: "desc" }, "date")).toEqual({
			key: "date",
			direction: "asc",
		});
	});

	test("aria-sort only marks the sorted column", () => {
		const sort = { key: "name", direction: "desc" } as const;
		expect(ariaSort(sort, "name")).toBe("descending");
		expect(ariaSort(sort, "date")).toBe("none");
		expect(ariaSort(null, "name")).toBe("none");
	});
});

describe("selection", () => {
	const page = ["a", "b", "c"];

	test("toggles one row without mutating the previous selection", () => {
		const one = toggleRow(NO_SELECTION, "a");
		expect([...one]).toEqual(["a"]);
		expect(NO_SELECTION.size).toBe(0);
		expect(toggleRow(one, "a").size).toBe(0);
	});

	test("the header state is none, some, then all", () => {
		expect(pageSelectionState(NO_SELECTION, page)).toBe("none");
		expect(pageSelectionState(new Set(["a"]), page)).toBe("some");
		expect(pageSelectionState(new Set(page), page)).toBe("all");
	});

	test("the header checkbox selects the page, then clears it", () => {
		const all = togglePage(new Set(["a"]), page);
		expect(pageSelectionState(all, page)).toBe("all");
		expect(togglePage(all, page).size).toBe(0);
	});

	test("an empty page is never « all »", () => {
		expect(pageSelectionState(NO_SELECTION, [])).toBe("none");
	});

	test("prune drops the rows that left the page", () => {
		const pruned = pruneSelection(new Set(["a", "z"]), page);
		expect([...pruned]).toEqual(["a"]);
	});

	test("prune keeps the same set when nothing leaves", () => {
		const selection = new Set(["a"]);
		expect(pruneSelection(selection, page)).toBe(selection);
	});
});

describe("pagination", () => {
	test("clamps the page into 1..pageCount", () => {
		expect(clampPage(0, 5)).toBe(1);
		expect(clampPage(9, 5)).toBe(5);
		expect(clampPage(Number.NaN, 5)).toBe(1);
		expect(clampPage(3, 0)).toBe(1);
	});

	test("reports the displayed range", () => {
		expect(pageRange(1, 10, 47)).toEqual({ from: 1, to: 10 });
		expect(pageRange(5, 10, 47)).toEqual({ from: 41, to: 47 });
		expect(pageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
	});
});
