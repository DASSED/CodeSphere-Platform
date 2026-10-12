/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { withoutOAuthTokens } from "./tokens";

describe("withoutOAuthTokens", () => {
	test("drops every OAuth token and keeps the account link", () => {
		const account = withoutOAuthTokens({
			accountId: "42",
			providerId: "github",
			userId: "u1",
			accessToken: "gho_secret",
			refreshToken: "ghr_secret",
			idToken: "eyJ.secret",
			accessTokenExpiresAt: new Date(),
			refreshTokenExpiresAt: new Date(),
		});
		expect(account).toEqual({
			accountId: "42",
			providerId: "github",
			userId: "u1",
			accessToken: null,
			refreshToken: null,
			idToken: null,
			accessTokenExpiresAt: null,
			refreshTokenExpiresAt: null,
		});
	});

	test("leaves an account without tokens unchanged apart from the nulls", () => {
		expect(withoutOAuthTokens({ providerId: "google" })).toMatchObject({
			providerId: "google",
			accessToken: null,
		});
	});
});
