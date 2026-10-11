// Consent given on the sign-in page before the OAuth redirect (spec §3, §4). The page sets this
// cookie once the box is ticked; the account is created only if it carries the current version.
export const CONSENT_COOKIE = "consent_version";

export type ConsentResult =
	| { accepted: true; consentVersion: string; consentAcceptedAt: Date }
	| { accepted: false };

export function readConsent(
	cookieHeader: string | null | undefined,
	currentVersion: string,
	now: Date,
): ConsentResult {
	for (const part of (cookieHeader ?? "").split(";")) {
		const [name, ...rest] = part.trim().split("=");
		if (name === CONSENT_COOKIE && rest.join("=") === currentVersion) {
			return {
				accepted: true,
				consentVersion: currentVersion,
				consentAcceptedAt: now,
			};
		}
	}
	return { accepted: false };
}
