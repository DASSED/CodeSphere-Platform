/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { deleteBlock, tagGroup, tagMutationErrorKey } from "./admin-tags";

const tag = (over = {}) => ({
	id: "t",
	name: "x",
	version: 1,
	questionCount: 0,
	ownerHackathon: null as string | null,
	...over,
});

describe("tagGroup", () => {
	test("protected first, then used, then unused", () => {
		expect(tagGroup(tag({ ownerHackathon: "cadev-2026" }))).toBe("protected");
		expect(tagGroup(tag({ questionCount: 3 }))).toBe("used");
		expect(tagGroup(tag())).toBe("unused");
	});
});

describe("deleteBlock", () => {
	test("says why a Tag cannot be deleted, before any action", () => {
		expect(deleteBlock(tag({ ownerHackathon: "cadev-2026" }))).toBe(
			"Protégé : possédé par le Hackathon cadev-2026",
		);
		expect(deleteBlock(tag({ questionCount: 12 }))).toBe(
			"Utilisé par 12 Questions",
		);
		expect(deleteBlock(tag({ questionCount: 1 }))).toBe(
			"Utilisé par 1 Question",
		);
		expect(deleteBlock(tag())).toBeNull();
	});
});

describe("tagMutationErrorKey", () => {
	test("CONFLICT is told apart from the rest", () => {
		expect(tagMutationErrorKey({ code: "CONFLICT" })).toBe("conflict");
		expect(tagMutationErrorKey({ code: "FORBIDDEN" })).toBe("forbidden");
		expect(tagMutationErrorKey(new Error("x"))).toBe("generic");
	});
});
