/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { isHackathonTab, milestoneStates, sortedMilestones } from "./hackathon";

const milestones = [
	{
		key: "registration",
		label: "Inscriptions",
		startsAt: "2026-10-01T00:00:00.000Z",
		endsAt: "2026-10-10T00:00:00.000Z",
	},
	{
		key: "submission_close",
		label: "Clôture",
		startsAt: "2026-10-25T17:00:00.000Z",
		endsAt: null,
	},
	{
		key: "results",
		label: "Résultats",
		startsAt: "2026-11-05T00:00:00.000Z",
		endsAt: null,
	},
];

describe("hackathon milestones", () => {
	test("a running Milestone is current, the ones after it upcoming", () => {
		expect(
			milestoneStates(milestones, new Date("2026-10-05T00:00:00Z")),
		).toEqual(["current", "upcoming", "upcoming"]);
	});

	test("between Milestones, the next one is current", () => {
		expect(
			milestoneStates(milestones, new Date("2026-10-15T00:00:00Z")),
		).toEqual(["done", "current", "upcoming"]);
	});

	test("a single date is done once passed", () => {
		expect(
			milestoneStates(milestones, new Date("2026-10-30T00:00:00Z")),
		).toEqual(["done", "done", "current"]);
		expect(
			milestoneStates(milestones, new Date("2026-12-01T00:00:00Z")),
		).toEqual(["done", "done", "done"]);
	});

	test("milestones are shown in date order", () => {
		const reversed = [...milestones].reverse();
		expect(sortedMilestones(reversed).map((m) => m.key)).toEqual([
			"registration",
			"submission_close",
			"results",
		]);
	});

	test("only known tabs are accepted from the URL", () => {
		expect(isHackathonTab("judging")).toBe(true);
		expect(isHackathonTab("admin")).toBe(false);
		expect(isHackathonTab(null)).toBe(false);
	});
});
