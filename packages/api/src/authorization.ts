import type { Session } from "@codesphere/auth";

export type AdminGuard =
	| { ok: true; role: "admin" }
	| { ok: false; code: "UNAUTHORIZED" | "FORBIDDEN" };

// The authorization decision behind every admin procedure (spec §2): a session is required,
// and its user must carry the admin role (granted only to verified ADMIN_EMAILS at creation).
export function requireAdmin(session: Session | null): AdminGuard {
	if (!session?.user) {
		return { ok: false, code: "UNAUTHORIZED" };
	}
	const role = (session.user as { role?: string }).role;
	if (role !== "admin") {
		return { ok: false, code: "FORBIDDEN" };
	}
	return { ok: true, role: "admin" };
}
