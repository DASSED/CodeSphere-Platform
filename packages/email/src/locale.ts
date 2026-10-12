export type Locale = "fr" | "en";

export const DEFAULT_LOCALE: Locale = "en";

/**
 * The language of an email, from the request that triggered it. The member's stored
 * preference does not exist yet: the Accept-Language header is the best signal at hand.
 */
export function localeFromAcceptLanguage(
	header: string | null | undefined,
): Locale {
	const first = header?.split(",")[0]?.trim().toLowerCase() ?? "";
	return first.startsWith("fr") ? "fr" : DEFAULT_LOCALE;
}
