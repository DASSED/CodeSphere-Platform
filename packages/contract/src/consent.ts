// The consent text version shown at sign-in (spec §4). The web page and the auth server both
// read it from here, so they cannot drift apart and silently refuse every new account (#63).
export const CONSENT_VERSION = "2026-10";

/** Cookie the sign-in page sets once the consent box is ticked, read when the account is created. */
export const CONSENT_COOKIE = "consent_version";
