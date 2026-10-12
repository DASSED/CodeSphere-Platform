/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { CONSENT_COOKIE, readConsent } from "./consent";

const NOW = new Date("2026-10-11T10:00:00.000Z");

describe("readConsent", () => {
	test("records the version and the date when the cookie carries the current version", () => {
		const result = readConsent(`${CONSENT_COOKIE}=2026-10`, "2026-10", NOW);
		expect(result).toEqual({
			accepted: true,
			consentVersion: "2026-10",
			consentAcceptedAt: NOW,
		});
	});

	test("finds the cookie among others", () => {
		const header = `theme=dark; ${CONSENT_COOKIE}=2026-10; locale=fr`;
		expect(readConsent(header, "2026-10", NOW).accepted).toBe(true);
	});

	test("refuses when there is no cookie header", () => {
		expect(readConsent(null, "2026-10", NOW).accepted).toBe(false);
	});

	test("refuses when the consent cookie is absent", () => {
		expect(readConsent("theme=dark", "2026-10", NOW).accepted).toBe(false);
	});

	test("refuses a consent given for another version", () => {
		expect(
			readConsent(`${CONSENT_COOKIE}=2025-01`, "2026-10", NOW).accepted,
		).toBe(false);
	});
});
