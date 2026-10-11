// Admins are designated by the ADMIN_EMAILS environment variable (spec §2). Only a verified
// email counts, so an unverified provider address cannot grant admin rights.
export function parseAdminEmails(raw: string | undefined): ReadonlySet<string> {
	return new Set(
		(raw ?? "")
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter((email) => email.length > 0),
	);
}

export function isAdminEmail(
	email: string,
	emailVerified: boolean,
	admins: ReadonlySet<string>,
): boolean {
	return emailVerified && admins.has(email.trim().toLowerCase());
}
