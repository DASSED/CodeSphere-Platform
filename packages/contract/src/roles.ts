// Roles a human Member can hold (spec §2). `member` is everyone else. The API and the web app read
// the same list, so a staff role is recognised the same way on both sides.
export const STAFF_ROLES = ["super_admin", "admin", "moderator"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const RANK: Record<StaffRole, number> = {
	super_admin: 3,
	admin: 2,
	moderator: 1,
};

/** Authority of a role: 0 for a plain Member, 1 to 3 for moderator, admin and super_admin. */
export function staffRank(role: unknown): number {
	return isStaffRole(role) ? RANK[role] : 0;
}

/** Whether `actor` may act on `target`: strictly higher rank, so peers and superiors are out of reach. */
export function outranks(actor: unknown, target: unknown): boolean {
	return staffRank(actor) > staffRank(target);
}

/** The roles a Member may hold and still be moderated by `actor`: `member` and every staff role below. */
export function rolesBelow(actor: unknown): string[] {
	return [
		"member",
		...STAFF_ROLES.filter((role) => RANK[role] < staffRank(actor)),
	];
}

/** True for the roles that may use the admin procedures and the admin area. */
export function isStaffRole(role: unknown): role is StaffRole {
	return STAFF_ROLES.includes(role as StaffRole);
}
