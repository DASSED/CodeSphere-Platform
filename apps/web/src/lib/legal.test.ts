/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { isLegalPage, LEGAL_PAGES, legalHref } from "./legal";

type Section = { title: string; body: string };
type LegalMessages = {
	pages: Record<
		string,
		{ title: string; intro: string; sections: Record<string, Section> }
	>;
};

describe("legal pages", () => {
	for (const [locale, messages] of [
		["fr", fr],
		["en", en],
	] as const) {
		test(`every page has a title, an intro and sections in ${locale}`, () => {
			const { pages } = messages.legal as LegalMessages;
			expect(Object.keys(pages).sort()).toEqual([...LEGAL_PAGES].sort());
			for (const page of LEGAL_PAGES) {
				const { title, intro, sections } = pages[page];
				expect(title.trim()).not.toBe("");
				expect(intro.trim()).not.toBe("");
				expect(Object.keys(sections).length).toBeGreaterThan(0);
				for (const section of Object.values(sections)) {
					expect(section.title.trim()).not.toBe("");
					expect(section.body.trim()).not.toBe("");
				}
			}
		});
	}

	// Bodies are rendered raw, so a brace would show up as is instead of being a placeholder.
	test("section bodies carry no ICU placeholder", () => {
		const bodies = [fr, en].flatMap((messages) =>
			Object.values((messages.legal as LegalMessages).pages).flatMap((page) =>
				Object.values(page.sections).map((section) => section.body),
			),
		);
		expect(bodies.filter((body) => /[{}]/.test(body))).toEqual([]);
	});

	// The login card links its consent box to these two pages.
	test("terms and privacy live where the consent box points", () => {
		expect(legalHref("terms")).toBe("/legal/terms");
		expect(legalHref("privacy")).toBe("/legal/privacy");
	});

	test("an unknown page is rejected", () => {
		expect(isLegalPage("privacy")).toBe(true);
		expect(isLegalPage("cookies")).toBe(false);
	});
});
