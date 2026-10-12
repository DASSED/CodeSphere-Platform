import type { Session } from "@codesphere/auth";

export type AdminGuard =
	| { ok: true; role: "admin" }
	| { ok: false; code: "UNAUTHORIZED" | "FORBIDDEN" };

// The authorization decision behind every admin procedure (spec §2): a session is required,
// and its user must be a human carrying the admin role (re-derived from ADMIN_EMAILS at each
// sign-in). An Agent is never an Admin, whatever its row says (#122).
export function requireAdmin(session: Session | null): AdminGuard {
	if (!session?.user) {
		return { ok: false, code: "UNAUTHORIZED" };
	}
	const { role, kind } = session.user as { role?: string; kind?: string };
	if (role !== "admin" || kind !== "human") {
		return { ok: false, code: "FORBIDDEN" };
	}
	return { ok: true, role: "admin" };
}
