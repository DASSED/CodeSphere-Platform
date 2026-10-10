import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@codesphere/db";
import * as schema from "@codesphere/db/schema/auth";
import { betterAuth } from "better-auth";

import { type SocialProviderEnv, socialProvidersFrom } from "./providers";

export type AuthConfig = SocialProviderEnv & {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
		// SSO only: no email/password sign-in (#59, spec §3).
		socialProviders: socialProvidersFrom(env),
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
