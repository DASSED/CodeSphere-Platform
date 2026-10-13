/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { apiFetch, type WorkerEnv, withoutDatabase } from "./worker";

// A preview deployed without a database (map #86, #150): the Worker must start, and readiness
// must answer 503 instead of the whole Worker refusing to boot.
const env: WorkerEnv = {
	BETTER_AUTH_SECRET: "s".repeat(32),
	BETTER_AUTH_URL: "https://pr-1.preview.example",
	CORS_ORIGIN: "https://pr-1.preview.example",
};

describe("Worker without DATABASE_URL", () => {
	test("starts and answers 503 on readiness", async () => {
		const response = await apiFetch(
			new Request("https://pr-1.preview.example/api/v1/ready"),
			env,
			{ waitUntil: () => {}, passThroughOnException: () => {} } as never,
		);
		expect(response.status).toBe(503);
	});

	test("a data call answers 503, not 500, when there is no database", async () => {
		const response = await apiFetch(
			new Request("https://pr-1.preview.example/rpc/hackathons/get", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ json: { slug: "cadev-2026" } }),
			}),
			env,
			{ waitUntil: () => {}, passThroughOnException: () => {} } as never,
		);
		expect(response.status).toBe(503);
	});

	test("every query on the fallback database rejects", async () => {
		const db = withoutDatabase();
		expect(() => db.select()).toThrow("no database configured");
	});
});
