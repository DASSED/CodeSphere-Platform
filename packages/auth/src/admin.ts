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

export type Role = "admin" | "member";

// The role a human Member must hold right now. Re-evaluated at every sign-in, so adding an
// email to ADMIN_EMAILS promotes at the next sign-in and removing it demotes (#120).
export function roleFor(
	user: { email: string; emailVerified: boolean },
	admins: ReadonlySet<string>,
): Role {
	return isAdminEmail(user.email, user.emailVerified, admins)
		? "admin"
		: "member";
}
