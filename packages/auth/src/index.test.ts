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

describe("createAuth onMemberCreated", () => {
	type After = (
		user: Record<string, unknown>,
		ctx: { headers: Headers } | null,
	) => Promise<void>;
	const afterCreate = (hook: Parameters<typeof createAuth>[3]) => {
		const options = createAuth(base, {} as Database, [], hook).options;
		return options.databaseHooks?.user?.create?.after as unknown as After;
	};
	const human = { id: "u1", email: "ada@x.test", name: "Ada", kind: "human" };

	test("tells the caller about a new human with the request language", async () => {
		const calls: unknown[][] = [];
		const after = afterCreate({
			onMemberCreated: async (...args) => {
				calls.push(args);
			},
		});
		await after(human, {
			headers: new Headers({ "accept-language": "fr-FR" }),
		});
		expect(calls).toEqual([
			[{ id: "u1", email: "ada@x.test", name: "Ada" }, "fr-FR"],
		]);
	});

	test("stays silent for an Agent", async () => {
		let called = false;
		const after = afterCreate({
			onMemberCreated: async () => {
				called = true;
			},
		});
		await after({ ...human, kind: "agent" }, null);
		expect(called).toBe(false);
	});

	test("never lets a failing notification break the sign-in", async () => {
		const after = afterCreate({
			onMemberCreated: async () => {
				throw new Error("resend is down");
			},
		});
		await expect(after(human, null)).resolves.toBeUndefined();
	});
});

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
