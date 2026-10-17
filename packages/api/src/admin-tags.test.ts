import { describe, expect, test } from "bun:test";

import { adminTag, normalizeTagName } from "./admin-tags";

describe("normalizeTagName", () => {
	test("`JavaScript ` and `javascript` are the same Tag", () => {
		expect(normalizeTagName("JavaScript ")).toBe(
			normalizeTagName("javascript"),
		);
	});
});

describe("adminTag", () => {
	test("reads the count back as a number and keeps the owner", () => {
		expect(
			adminTag({
				id: "t1",
				name: "cadev-2026",
				version: 1,
				questionCount: "12" as unknown as number,
				ownerHackathon: "cadev-2026",
			}),
		).toMatchObject({ questionCount: 12, ownerHackathon: "cadev-2026" });
	});
});
