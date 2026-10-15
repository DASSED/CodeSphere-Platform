/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { gettingStarted, shouldOnboard } from "./tags-onboarding";

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

describe("gettingStarted", () => {
	test("nothing is decided while the account is loading", () => {
		expect(
			gettingStarted({ followedCount: undefined, hasAskedQuestion: false }),
		).toBeNull();
		expect(
			gettingStarted({ followedCount: 3, hasAskedQuestion: undefined }),
		).toBeNull();
	});

	test("a new Member has only the account step done", () => {
		expect(
			gettingStarted({ followedCount: 0, hasAskedQuestion: false }),
		).toEqual({ tags: false, question: false, done: 1, complete: false });
	});

	test("following 3 Tags ticks the Tags step, 2 do not", () => {
		expect(
			gettingStarted({ followedCount: 2, hasAskedQuestion: false })?.tags,
		).toBe(false);
		expect(
			gettingStarted({ followedCount: 3, hasAskedQuestion: false }),
		).toEqual({ tags: true, question: false, done: 2, complete: false });
	});

	test("every step done completes the checklist", () => {
		expect(
			gettingStarted({ followedCount: 5, hasAskedQuestion: true }),
		).toEqual({ tags: true, question: true, done: 3, complete: true });
	});
});
