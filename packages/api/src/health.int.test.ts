/// <reference types="bun" />
// Readiness against a real Postgres (#60). Runs only with TEST_DATABASE_URL (CI integration job).
import { afterAll, describe, expect, test } from "bun:test";
import { createDb } from "@codesphere/db";
import { createRouterClient } from "@orpc/server";

import { appRouter } from "./routers";
import { testContext } from "./test-context";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("health.ready on Postgres", () => {
	const db = createDb({ DATABASE_URL: url ?? "" });
	const unreachable = createDb({
		DATABASE_URL: "postgres://nobody:nothing@127.0.0.1:1/none",
	});

	afterAll(async () => {
		await db.$client.end();
		await unreachable.$client.end();
	});

	test("is ready when Postgres answers", async () => {
		const client = createRouterClient(appRouter, {
			context: testContext({ db }),
		});
		expect(await client.health.ready()).toEqual({ status: "ready" });
	});

	test("answers SERVICE_UNAVAILABLE when nothing listens on the database port", async () => {
		const client = createRouterClient(appRouter, {
			context: testContext({ db: unreachable }),
		});
		await expect(client.health.ready()).rejects.toMatchObject({
			code: "SERVICE_UNAVAILABLE",
		});
	});
});
