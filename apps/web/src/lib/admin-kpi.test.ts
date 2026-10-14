/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { deltaOf, formatMetric, formatMinutes } from "./admin-kpi";

describe("admin KPI", () => {
	test("durations read in minutes, hours or days", () => {
		expect(formatMinutes(45)).toBe("45 min");
		expect(formatMinutes(130)).toBe("2 h 10");
		expect(formatMinutes(60 * 24 * 3 + 240)).toBe("3 j 4 h");
	});

	test("rates are percentages, counts are grouped", () => {
		expect(formatMetric("answerRate", 0.74, "en")).toBe("74%");
		expect(formatMetric("questions", 1240, "en")).toBe("1,240");
		expect(formatMetric("agentShare", null, "fr")).toBeNull();
	});

	test("the change needs a non-zero previous value", () => {
		expect(deltaOf(110, 100)).toBe(10);
		expect(deltaOf(5, 0)).toBeUndefined();
		expect(deltaOf(null, 3)).toBeUndefined();
		expect(deltaOf(0.5, 0.4)).toBe(25);
	});
});
