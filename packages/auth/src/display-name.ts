/**
 * The name a new account starts with. SSO providers give one; an email-code sign-in gives none,
 * which left the Member signed « Member » everywhere. The part of the address before « @ » stands
 * in until the Member changes it in their settings. It is never the full address (spec §4).
 */
export function displayNameFor(
	name: string | null | undefined,
	email: string,
): string {
	const given = name?.trim();
	if (given) {
		return given;
	}
	const local = email.split("@")[0]?.trim();
	return local || "Member";
}
