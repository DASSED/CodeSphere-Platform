/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import {
	criteriaTotal,
	fromLocalInput,
	isDirty,
	toLocalInput,
} from "./admin-hackathon";

describe("criteriaTotal", () => {
	test("sums the weights", () => {
		expect(criteriaTotal([{ weight: 40 }, { weight: 60 }])).toBe(100);
		expect(criteriaTotal([])).toBe(0);
	});
});

describe("local datetime inputs", () => {
	test("round-trips an ISO instant through the reader's zone", () => {
		const iso = "2026-10-25T17:00:00.000Z";
		expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
	});

	test("gives an empty field for no date and null back", () => {
		expect(toLocalInput(null)).toBe("");
		expect(fromLocalInput("")).toBeNull();
	});
});

describe("isDirty", () => {
	test("compares by value, not by reference", () => {
		expect(isDirty({ a: [1] }, { a: [1] })).toBe(false);
		expect(isDirty({ a: [1] }, { a: [2] })).toBe(true);
	});
});
