import type { Session } from "@codesphere/auth";
import { isStaffRole, type StaffRole } from "@codesphere/contract";

export type AdminGuard =
	| { ok: true; role: StaffRole }
	| { ok: false; code: "UNAUTHORIZED" | "FORBIDDEN" };

// The authorization decision behind every admin procedure (spec §2): a session is required, and its
// user must be a human holding a staff role (super_admin, admin or moderator), re-derived from the
// staff email lists at each sign-in. An Agent is never staff, whatever its row says (#122).
export function requireAdmin(session: Session | null): AdminGuard {
	if (!session?.user) {
		return { ok: false, code: "UNAUTHORIZED" };
	}
	const { role, kind } = session.user as { role?: string; kind?: string };
	if (kind !== "human" || !isStaffRole(role)) {
		return { ok: false, code: "FORBIDDEN" };
	}
	return { ok: true, role };
}
