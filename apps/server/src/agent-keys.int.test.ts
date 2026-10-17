/// <reference types="bun" />
// Agent keys over HTTP, with the real better-auth key check (#50): a key past 120 requests per
// minute answers 429 with `retryAfter` (never 401), a disabled key is anonymous (401) and a
// read-only key cannot write (FORBIDDEN).
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { appRouter } from "@codesphere/api/routers/index";
import { testContext } from "@codesphere/api/test-context";
import type { Session } from "@codesphere/auth";
import { createAuth } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { auditLog } from "@codesphere/db/schema/audit";
import { apikey, user } from "@codesphere/db/schema/auth";
import { createLogger } from "@codesphere/logger";
import { createRouterClient } from "@orpc/server";
import { inArray } from "drizzle-orm";

import { createApp } from "./app";
import { rateLimitRetryAfter } from "./context";

const url = process.env.TEST_DATABASE_URL;

describe("rateLimitRetryAfter", () => {
	test("reads better-auth's 429 refusal in seconds", () => {
		expect(
			rateLimitRetryAfter({
				statusCode: 429,
				body: { code: "RATE_LIMITED", details: { tryAgainIn: 12_300 } },
			}),
		).toBe(13);
	});

	test("anything else is not a rate limit", () => {
		expect(rateLimitRetryAfter({ statusCode: 401 })).toBeUndefined();
		expect(rateLimitRetryAfter(new Error("boom"))).toBeUndefined();
		expect(rateLimitRetryAfter(undefined)).toBeUndefined();
	});
});

describe.skipIf(!url)("agent keys over HTTP on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const owner = `it-keys-owner-${crypto.randomUUID()}`;
	const origin = "http://localhost:3000";
	const auth = createAuth(
		{
			BETTER_AUTH_URL: origin,
			BETTER_AUTH_SECRET: "s".repeat(32),
			CORS_ORIGIN: origin,
		} as never,
		db,
	);
	const app = createApp({
		auth,
		db,
		logger: createLogger({ level: "silent" }),
		corsOrigin: origin,
		trustProxy: false,
		release: { version: "test", commit: "test" },
		apiDocs: false,
	});
	const asOwner = createRouterClient(appRouter, {
		context: testContext({
			db,
			session: {
				user: { id: owner, role: "member", kind: "human" },
				session: { id: `s-${owner}` },
			} as unknown as Session,
		}),
	});

	const me = (key: string) =>
		app.request("/rpc/members/me", {
			method: "POST",
			headers: { "content-type": "application/json", "x-api-key": key },
			body: JSON.stringify({}),
		});

	beforeAll(async () => {
		await db
			.insert(user)
			.values({ id: owner, name: owner, email: `${owner}@example.com` });
	});

	afterAll(async () => {
		const agents = await db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.ownerId, [owner]));
		const all = [owner, ...agents.map((a) => a.id)];
		await db.delete(auditLog).where(inArray(auditLog.actorId, all));
		await db.delete(apikey).where(inArray(apikey.referenceId, all));
		await db.delete(user).where(
			inArray(
				user.id,
				agents.map((a) => a.id),
			),
		);
		await db.delete(user).where(inArray(user.id, [owner]));
	});

	test("the 121st request of the minute is a 429 with retryAfter, not a 401", async () => {
		const { key } = await asOwner.agents.create({
			name: "busy",
			preset: "read",
		});
		expect(key.startsWith("cs_live_")).toBe(true);
		for (let i = 0; i < 120; i++) {
			const response = await me(key);
			expect(response.status).toBe(200);
		}
		const refused = await me(key);
		expect(refused.status).toBe(429);
		const body = (await refused.json()) as {
			json: { code: string; data: { retryAfter: number } };
		};
		expect(body.json.code).toBe("TOO_MANY_REQUESTS");
		expect(body.json.data.retryAfter).toBeGreaterThan(0);
	}, 60_000);

	test("a disabled key is refused with 401", async () => {
		const { agent, key } = await asOwner.agents.create({
			name: "retired",
			preset: "contribute",
		});
		expect((await me(key)).status).toBe(200);
		await asOwner.agents.disable({ id: agent.id });
		expect((await me(key)).status).toBe(401);
	});

	test("a read-only key cannot write: FORBIDDEN", async () => {
		const { key } = await asOwner.agents.create({
			name: "reader",
			preset: "read",
		});
		const response = await app.request("/rpc/questions/create", {
			method: "POST",
			headers: { "content-type": "application/json", "x-api-key": key },
			body: JSON.stringify({
				json: {
					idempotencyKey: crypto.randomUUID(),
					title: "From a read-only key",
					body: "hello",
					language: "en",
					tags: ["sql"],
				},
			}),
		});
		expect(response.status).toBe(403);
	});
});
