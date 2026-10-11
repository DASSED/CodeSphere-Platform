export type SocialProviderEnv = {
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	GITLAB_CLIENT_ID?: string;
	GITLAB_CLIENT_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
};

export type SocialProviderName = "github" | "gitlab" | "google";

export type SocialProviderConfig = {
	clientId: string;
	clientSecret: string;
	scope: string[];
	disableDefaultScope: true;
};

// Minimal scopes (spec §3): identity, verified email and avatar, nothing that can act for the
// member. Pinned here so a better-auth upgrade cannot widen them silently.
const SCOPES: Record<SocialProviderName, string[]> = {
	github: ["read:user", "user:email"],
	gitlab: ["read_user"],
	google: ["openid", "email", "profile"],
};

// Only providers with both halves of their credentials are enabled, so a missing secret
// cannot leave a half-configured button behind (#63).
export function socialProvidersFrom(
	env: SocialProviderEnv,
): Partial<Record<SocialProviderName, SocialProviderConfig>> {
	const providers: Partial<Record<SocialProviderName, SocialProviderConfig>> =
		{};
	const pairs: [SocialProviderName, string | undefined, string | undefined][] =
		[
			["github", env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET],
			["gitlab", env.GITLAB_CLIENT_ID, env.GITLAB_CLIENT_SECRET],
			["google", env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET],
		];
	for (const [name, clientId, clientSecret] of pairs) {
		if (clientId && clientSecret) {
			providers[name] = {
				clientId,
				clientSecret,
				scope: SCOPES[name],
				disableDefaultScope: true,
			};
		}
	}
	return providers;
}
