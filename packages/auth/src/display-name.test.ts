import { describe, expect, test } from "bun:test";

import { displayNameFor } from "./display-name";

describe("displayNameFor", () => {
	test("keeps the name the provider gave", () => {
		expect(displayNameFor("Awa Traoré", "awa@example.com")).toBe("Awa Traoré");
	});

	test("an email-code sign-in has no name: the address before @ stands in", () => {
		expect(displayNameFor("", "davedaydy@gmail.com")).toBe("davedaydy");
		expect(displayNameFor("   ", "a.diallo@example.sn")).toBe("a.diallo");
	});

	test("a missing name and an address without @ still give a name", () => {
		expect(displayNameFor(undefined, "")).toBe("Member");
	});
});
