import { CONSENT_COOKIE } from "@codesphere/contract/consent";

// Consent given on the sign-in page before the OAuth redirect (spec §3, §4): the account is
// created only if the consent cookie carries the current version.
export { CONSENT_COOKIE };

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
