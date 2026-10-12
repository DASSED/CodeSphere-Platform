/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Under workerd, `pino` resolves to its browser build: `redact` and a custom destination are
// ignored, so an email, a cookie or a token logged by mistake reaches Workers Logs unredacted
// (checked on a local Worker, 2026-10-11). The Worker config pins the Node build instead.
// Without the alias the redaction promised by spec §4 silently stops applying on previews.
describe("Worker build of the logger", () => {
	test("wrangler.jsonc forces the Node build of pino", () => {
		const config = readFileSync(
			join(import.meta.dir, "../../../apps/web/wrangler.jsonc"),
			"utf8",
		);
		// JSONC: drop line comments before parsing.
		const parsed = JSON.parse(config.replace(/^\s*\/\/.*$/gm, "")) as {
			alias?: Record<string, string>;
		};
		expect(parsed.alias?.pino).toBe("pino/pino.js");
	});
});
