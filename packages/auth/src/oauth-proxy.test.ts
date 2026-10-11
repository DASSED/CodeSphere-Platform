/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { oauthProxyFrom } from "./oauth-proxy";

const secret = "s".repeat(32);

describe("oauthProxyFrom", () => {
	test("is off when neither value is set (production)", () => {
		expect(oauthProxyFrom({})).toBeNull();
	});

	test("refuses a half configuration", () => {
		expect(() => oauthProxyFrom({ OAUTH_PROXY_SECRET: secret })).toThrow();
		expect(() =>
			oauthProxyFrom({
				OAUTH_PROXY_PRODUCTION_URL: "https://staging.codesphereplatform.xyz",
			}),
		).toThrow();
	});

	test("refuses a short secret", () => {
		expect(() =>
			oauthProxyFrom({
				OAUTH_PROXY_SECRET: "short",
				OAUTH_PROXY_PRODUCTION_URL: "https://staging.codesphereplatform.xyz",
			}),
		).toThrow("at least 32");
	});

	test("refuses a non-https origin", () => {
		expect(() =>
			oauthProxyFrom({
				OAUTH_PROXY_SECRET: secret,
				OAUTH_PROXY_PRODUCTION_URL: "http://staging.codesphereplatform.xyz",
			}),
		).toThrow("https");
	});

	test("keeps only the origin and a 60 second window", () => {
		expect(
			oauthProxyFrom({
				OAUTH_PROXY_SECRET: secret,
				OAUTH_PROXY_PRODUCTION_URL:
					"https://staging.codesphereplatform.xyz/api/auth/",
			}),
		).toEqual({
			secret,
			productionURL: "https://staging.codesphereplatform.xyz",
			maxAge: 60,
		});
	});
});
