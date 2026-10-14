/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { shouldOnboard } from "./tags-onboarding";

describe("shouldOnboard", () => {
	test("a Member who follows nothing and did not skip is onboarded", () => {
		expect(shouldOnboard({ followedCount: 0, skipped: false })).toBe(true);
	});

	test("following at least one Tag ends the onboarding", () => {
		expect(shouldOnboard({ followedCount: 1, skipped: false })).toBe(false);
	});

	test("skipping the step is respected", () => {
		expect(shouldOnboard({ followedCount: 0, skipped: true })).toBe(false);
	});

	test("waits for the followed Tags and the profile before deciding", () => {
		expect(shouldOnboard({ followedCount: undefined, skipped: false })).toBe(
			false,
		);
		expect(shouldOnboard({ followedCount: 0, skipped: undefined })).toBe(false);
	});
});
