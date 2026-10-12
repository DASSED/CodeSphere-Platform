/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The Worker reaches Postgres over Neon's HTTP driver, which has no transactions (edge.ts).
// A feature that needs one (a vote counter, a payment, an account deletion) must move that
// code path to the WebSocket pool first; until then this guard keeps it from slipping in
// unnoticed and failing only on a preview.
const ROOTS = [
	"../../api/src",
	"../../auth/src",
	"../../../apps/server/src",
	"../../../apps/web/src",
];

function sources(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			return name === "node_modules" ? [] : sources(path);
		}
		return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
	});
}

describe("edge database", () => {
	test("no code path opens a transaction", () => {
		const offenders = ROOTS.flatMap((root) =>
			sources(join(import.meta.dir, root)).filter((file) =>
				/\.transaction\s*\(/.test(readFileSync(file, "utf8")),
			),
		);
		expect(offenders).toEqual([]);
	});
});
