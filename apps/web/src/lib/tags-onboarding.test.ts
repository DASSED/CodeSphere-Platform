/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import {
	isOnboardingSkipped,
	markOnboardingSkipped,
	shouldOnboard,
} from "./tags-onboarding";

const memory = () => {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
	};
};

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

	test("waits for the followed Tags before deciding", () => {
		expect(shouldOnboard({ followedCount: undefined, skipped: false })).toBe(
			false,
		);
	});
});

describe("skip flag", () => {
	test("is remembered per Member", () => {
		const storage = memory();
		expect(isOnboardingSkipped(storage, "u1")).toBe(false);
		markOnboardingSkipped(storage, "u1");
		expect(isOnboardingSkipped(storage, "u1")).toBe(true);
		expect(isOnboardingSkipped(storage, "u2")).toBe(false);
	});
});
