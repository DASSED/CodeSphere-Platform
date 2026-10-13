// The REST surface of the feed (#65): the generated OpenAPI document lists the new operations as
// public reads, and a real GET with a query string reaches the procedure (query values arrive as
// strings, so `limit` must still validate).
import { describe, expect, test } from "bun:test";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import { exposedOverMCP, exposedOverOpenAPI, mcpTools } from "./exposure";
import { appRouter } from "./routers";

const spec = await new OpenAPIGenerator({
	converters: [new ZodToJsonSchemaConverter()],
}).generate(appRouter, {
	filter: exposedOverOpenAPI,
	base: { info: { title: "CodeSphere API", version: "1.0.0" } },
});

type Operation = {
	tags?: string[];
	parameters?: { name: string; in: string; required?: boolean }[];
};
const operation = (path: string) =>
	(spec.paths as Record<string, { get?: Operation }>)[path]?.get;

describe("OpenAPI document", () => {
	test("GET /questions lists Questions with its filters as query parameters", () => {
		const op = operation("/questions");
		expect(op?.tags).toEqual(["questions"]);
		const names = op?.parameters?.map((p) => p.name) ?? [];
		for (const name of [
			"tags",
			"language",
			"country",
			"status",
			"sort",
			"cursor",
			"limit",
		]) {
			expect(names).toContain(name);
		}
		expect(op?.parameters?.every((p) => p.in === "query")).toBe(true);
	});

	test("GET /feed/for-you is documented under the feed tag", () => {
		const op = operation("/feed/for-you");
		expect(op?.tags).toEqual(["feed"]);
		const names = op?.parameters?.map((p) => p.name) ?? [];
		expect(names).toContain("cursor");
		expect(names).toContain("limit");
	});
});

describe("MCP surface", () => {
	test("questions.list is a read-only tool and feed.forYou is not a tool", () => {
		const tools = mcpTools(appRouter).map((t) => t.path.join("."));
		expect(tools).toContain("questions.list");
		expect(tools).not.toContain("feed.forYou");
		expect(
			mcpTools(appRouter).find((t) => t.path.join(".") === "questions.list")
				?.readOnly,
		).toBe(true);
		expect(exposedOverMCP({ path: ["questions", "list"], meta: {} })).toBe(
			true,
		);
	});
});
