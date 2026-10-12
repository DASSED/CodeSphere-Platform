/// <reference types="bun" />
// #122: admin mutations are web-only. They never reach the MCP server nor the OpenAPI surface.
import { describe, expect, test } from "bun:test";
import { OpenAPIGenerator, openapi } from "@orpc/openapi";
import { os } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { mcp } from "orpc-mcp";

import { exposedOverOpenAPI, mcpTools } from "./exposure";
import { appRouter } from "./routers";

const mutation = os
	.meta(openapi({ method: "POST", path: "/admin/tags" }))
	.handler(() => null);
const read = os
	.meta(openapi({ method: "GET", path: "/admin/audit-log" }))
	.handler(() => null);
const bare = os.handler(() => null);

describe("exposedOverOpenAPI", () => {
	test("hides an admin mutation", () => {
		expect(exposedOverOpenAPI(mutation, ["admin", "tags", "create"])).toBe(
			false,
		);
	});

	test("hides an admin procedure without an explicit GET route", () => {
		expect(exposedOverOpenAPI(bare, ["admin", "tags", "create"])).toBe(false);
	});

	test("keeps an admin read and any non-admin procedure", () => {
		expect(exposedOverOpenAPI(read, ["admin", "auditLog", "list"])).toBe(true);
		expect(exposedOverOpenAPI(mutation, ["members", "update"])).toBe(true);
	});
});

describe("the served router", () => {
	test("the OpenAPI spec has no admin operation other than GET", async () => {
		const spec = await new OpenAPIGenerator({
			converters: [new ZodToJsonSchemaConverter()],
		}).generate(appRouter, { filter: exposedOverOpenAPI });
		const adminMethods = Object.entries(spec.paths ?? {})
			.filter(([path]) => path.startsWith("/admin"))
			.flatMap(([, item]) => Object.keys(item ?? {}));
		expect(adminMethods.length).toBeGreaterThan(0);
		expect(adminMethods.every((method) => method === "get")).toBe(true);
	});

	test("every admin MCP tool is read-only", () => {
		const admin = mcpTools(appRouter).filter(({ path }) => path[0] === "admin");
		expect(admin.length).toBeGreaterThan(0);
		expect(admin.every(({ readOnly }) => readOnly)).toBe(true);
	});

	test("an admin mutation tagged for MCP would be caught", () => {
		const router = {
			admin: {
				tags: {
					create: os.meta(mcp.tool({ description: "x" })).handler(() => null),
				},
			},
		};
		expect(mcpTools(router)).toEqual([
			{ path: ["admin", "tags", "create"], readOnly: false },
		]);
	});
});
