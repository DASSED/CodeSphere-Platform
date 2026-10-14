// Legal pages (spec §4, #56), reached from the footer and from the consent box at sign-in.
export const LEGAL_PAGES = ["terms", "privacy", "notice", "contact"] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];

/** Date of the current legal texts, shown on each page. */
export const LEGAL_UPDATED_AT = "2026-10-14";

export function isLegalPage(value: string): value is LegalPage {
	return LEGAL_PAGES.some((page) => page === value);
}

/** The login card links to `/legal/terms` and `/legal/privacy` by default. */
export function legalHref(page: LegalPage): string {
	return `/legal/${page}`;
}
