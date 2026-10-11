/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { ownProfile, type ProfileRow, publicProfile } from "./profile";

const row: ProfileRow & { email: string } = {
	id: "u1",
	name: "Ada",
	image: "https://avatars.example.com/ada.png",
	kind: "human",
	ownerId: null,
	country: "BF",
	city: "Ouagadougou",
	cityPublic: false,
	hideAgentContent: false,
	email: "ada@example.com",
};

describe("publicProfile", () => {
	test("never exposes the email", () => {
		expect(JSON.stringify(publicProfile(row))).not.toContain("ada@example.com");
	});

	test("hides the city until the member makes it public", () => {
		expect(publicProfile(row).city).toBeNull();
		expect(publicProfile({ ...row, cityPublic: true }).city).toBe(
			"Ouagadougou",
		);
	});

	test("shows the avatar", () => {
		expect(publicProfile(row).image).toBe("https://avatars.example.com/ada.png");
	});

	test("keeps the country public", () => {
		expect(publicProfile(row).country).toBe("BF");
	});
});

describe("ownProfile", () => {
	test("shows the member their private city and settings, still without the email", () => {
		const own = ownProfile(row);
		expect(own.city).toBe("Ouagadougou");
		expect(own.cityPublic).toBe(false);
		expect(JSON.stringify(own)).not.toContain("ada@example.com");
	});
});
