import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { CONSENT_VERSION } from "@codesphere/contract/consent";
import type { Database } from "@codesphere/db";
import * as schema from "@codesphere/db/schema/auth";
import { betterAuth } from "better-auth";

import { isAdminEmail, parseAdminEmails } from "./admin";
import { readConsent } from "./consent";
import { withoutOAuthTokens } from "./tokens";
import { type SocialProviderEnv, socialProvidersFrom } from "./providers";

export type AuthConfig = SocialProviderEnv & {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
	ADMIN_EMAILS?: string;
};

const stripTokens = async <T extends object>(account: T) => ({
	data: withoutOAuthTokens(account),
});

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	const admins = parseAdminEmails(env.ADMIN_EMAILS);

	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
		// SSO only: no email/password sign-in (#59, spec §3).
		socialProviders: socialProvidersFrom(env),
		account: {
			// Link provider accounts on a verified email only: no trusted providers, so an
			// unverified address is rejected instead of being merged (spec §3).
			accountLinking: { enabled: true, trustedProviders: [] },
		},
		databaseHooks: {
			account: {
				// First sign-in and linking create the account; a later sign-in updates its tokens.
				create: { before: stripTokens },
				update: { before: stripTokens },
			},
			user: {
				create: {
					before: async (user, ctx) => {
						// No consent, no account (spec §3).
						const consent = readConsent(
							ctx?.headers?.get("cookie"),
							CONSENT_VERSION,
							new Date(),
						);
						if (!consent.accepted) {
							return false;
						}
						return {
							data: {
								...user,
								role: isAdminEmail(user.email, user.emailVerified, admins)
									? "admin"
									: "member",
								consentVersion: consent.consentVersion,
								consentAcceptedAt: consent.consentAcceptedAt,
							},
						};
					},
				},
			},
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		user: {
			additionalFields: {
				// "human" | "agent"; set server-side only, never by the client.
				kind: {
					type: ["human", "agent"],
					required: false,
					defaultValue: "human",
					input: false,
				},
				// For agents: the human Member who owns and answers for them.
				ownerId: { type: "string", required: false, input: false },
				// "admin" | "member"; derived from ADMIN_EMAILS at account creation, never by the client.
				role: {
					type: "string",
					required: false,
					defaultValue: "member",
					input: false,
				},
			},
		},
		plugins: [
			apiKey({
				enableSessionForAPIKeys: true,
				// Accept the key as `x-api-key` (default) or `Authorization: Bearer <key>` (MCP clients).
				customAPIKeyGetter: (ctx) => {
					const direct = ctx.headers?.get("x-api-key");
					if (direct) {
						return direct;
					}
					const authorization = ctx.headers?.get("authorization");
					return authorization?.startsWith("Bearer ")
						? authorization.slice(7)
						: null;
				},
				rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 120 },
			}),
		],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
