/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { createRouterClient } from "@orpc/server";

import type { Context } from "./context";
import { appRouter } from "./routers";
import { testContext } from "./test-context";

function client(db: unknown) {
	return createRouterClient(appRouter, {
		context: testContext({
			db: db as Context["db"],
			release: { version: "main-3f2a9c1", commit: "3f2a9c1e" },
		}),
	});
}

describe("health.check", () => {
	test("reports the running version and commit", async () => {
		expect(await client({}).health.check()).toEqual({
			status: "ok",
			version: "main-3f2a9c1",
			commit: "3f2a9c1e",
		});
	});
});

describe("health.ready", () => {
	test("is ready when the database answers", async () => {
		const db = { execute: async () => ({ rows: [{ "?column?": 1 }] }) };
		expect(await client(db).health.ready()).toEqual({ status: "ready" });
	});

	test("answers SERVICE_UNAVAILABLE when the database is down", async () => {
		const db = {
			execute: async () => {
				throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
			},
		};
		const error = await client(db)
			.health.ready()
			.catch((caught: unknown) => caught);
		expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE", defined: true });
		expect((error as Error).message).not.toContain("ECONNREFUSED");
	});
});
