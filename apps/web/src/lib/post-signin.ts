import { isStaffRole } from "@codesphere/contract/roles";

// Where a sign-in lands (#121): staff (admin, super admin, moderator) go to the back-office, any other Member home, and
// a request without a session back to the sign-in page. The OAuth callback cannot know the role
// in advance, so it always comes through /post-signin, which applies this rule.
export function postSignInPath(
	user: { role?: string | null } | null | undefined,
): "/admin" | "/" | "/signin" {
	if (!user) {
		return "/signin";
	}
	return isStaffRole(user.role) ? "/admin" : "/";
}
