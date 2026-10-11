// better-auth sends the OAuth callback failure back as `?error=<code>`. The account creation
// is refused only when the consent cookie is missing (#63), so that code means "no consent".
export type SignInErrorKey = "consentRequired" | "failed";

export function signInErrorKey(error: string | null): SignInErrorKey | null {
	if (!error) {
		return null;
	}
	return error === "unable_to_create_user" ? "consentRequired" : "failed";
}
