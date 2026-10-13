/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import committed from "../openapi.json";
import { openApiDocument } from "./openapi";

describe("openapi.json", () => {
	// Regenerate after a contract change: the emit script is `bun` over openApiDocument(), written to
	// packages/api/openapi.json with tabs and a trailing newline.
	test("matches the document the contract generates", async () => {
		const generated = JSON.parse(JSON.stringify(await openApiDocument()));
		expect(committed).toEqual(generated);
	});
});
