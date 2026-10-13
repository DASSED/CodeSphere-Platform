// Roles a human Member can hold (spec §2). `member` is everyone else. The API and the web app read
// the same list, so a staff role is recognised the same way on both sides.
export const STAFF_ROLES = ["super_admin", "admin", "moderator"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** True for the roles that may use the admin procedures and the admin area. */
export function isStaffRole(role: unknown): role is StaffRole {
	return STAFF_ROLES.includes(role as StaffRole);
}
