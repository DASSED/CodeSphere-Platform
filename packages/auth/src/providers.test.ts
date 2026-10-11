/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { socialProvidersFrom } from "./providers";

describe("socialProvidersFrom", () => {
	test("enables nothing without credentials (SSO not configured yet)", () => {
		expect(socialProvidersFrom({})).toEqual({});
	});

	test("ignores a provider that has only its client id or only its secret", () => {
		expect(socialProvidersFrom({ GITHUB_CLIENT_ID: "id" })).toEqual({});
		expect(socialProvidersFrom({ GOOGLE_CLIENT_SECRET: "secret" })).toEqual({});
	});

	test("enables each provider whose id and secret are both set", () => {
		expect(
			socialProvidersFrom({
				GITHUB_CLIENT_ID: "gh-id",
				GITHUB_CLIENT_SECRET: "gh-secret",
				GITLAB_CLIENT_ID: "gl-id",
				GITLAB_CLIENT_SECRET: "gl-secret",
			}),
		).toMatchObject({
			github: { clientId: "gh-id", clientSecret: "gh-secret" },
			gitlab: { clientId: "gl-id", clientSecret: "gl-secret" },
		});
	});

	test("asks each provider only for identity, verified email and avatar", () => {
		const providers = socialProvidersFrom({
			GITHUB_CLIENT_ID: "gh-id",
			GITHUB_CLIENT_SECRET: "gh-secret",
			GITLAB_CLIENT_ID: "gl-id",
			GITLAB_CLIENT_SECRET: "gl-secret",
			GOOGLE_CLIENT_ID: "go-id",
			GOOGLE_CLIENT_SECRET: "go-secret",
		});
		expect(providers.github).toMatchObject({
			scope: ["read:user", "user:email"],
			disableDefaultScope: true,
		});
		expect(providers.gitlab).toMatchObject({
			scope: ["read_user"],
			disableDefaultScope: true,
		});
		expect(providers.google).toMatchObject({
			scope: ["openid", "email", "profile"],
			disableDefaultScope: true,
		});
	});
});
