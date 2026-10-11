/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Database } from "@codesphere/db";

import { createAuth } from "./index";

const base = {
	BETTER_AUTH_URL: "https://pr-1.preview.codesphereplatform.xyz",
	BETTER_AUTH_SECRET: "x".repeat(32),
	CORS_ORIGIN: "https://pr-1.preview.codesphereplatform.xyz",
};

const pluginIds = (env: Parameters<typeof createAuth>[0]) =>
	(createAuth(env, {} as Database).options.plugins ?? []).map((p) => p.id);

describe("createAuth OAuth proxy", () => {
	test("is not installed without proxy settings", () => {
		expect(pluginIds(base)).not.toContain("oauth-proxy");
	});

	test("is installed when the secret and the staging origin are set", () => {
		expect(
			pluginIds({
				...base,
				OAUTH_PROXY_SECRET: "p".repeat(32),
				OAUTH_PROXY_PRODUCTION_URL: "https://staging.codesphereplatform.xyz",
			}),
		).toContain("oauth-proxy");
	});
});
