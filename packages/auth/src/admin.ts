import type { Role } from "@codesphere/contract/roles";

// Staff roles are designated by environment variables (spec §2). Only a verified email counts, so
// an unverified provider address cannot grant a role. A human holds the highest role whose list
// names their email: super_admin, then admin, then moderator.
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

export type { Role } from "@codesphere/contract/roles";

export type StaffLists = {
	superAdmins: ReadonlySet<string>;
	admins: ReadonlySet<string>;
	moderators: ReadonlySet<string>;
};

// The role a human Member must hold right now. Re-evaluated at every sign-in, so adding an
// email to a list promotes at the next sign-in and removing it demotes (#120).
export function roleFor(
	user: { email: string; emailVerified: boolean },
	staff: StaffLists,
): Role {
	if (isAdminEmail(user.email, user.emailVerified, staff.superAdmins)) {
		return "super_admin";
	}
	if (isAdminEmail(user.email, user.emailVerified, staff.admins)) {
		return "admin";
	}
	if (isAdminEmail(user.email, user.emailVerified, staff.moderators)) {
		return "moderator";
	}
	return "member";
}
