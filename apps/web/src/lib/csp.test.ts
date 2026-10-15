import { describe, expect, test } from "bun:test";

import { buildCsp, createNonce } from "./csp";

function directive(csp: string, name: string): string | undefined {
	return csp
		.split("; ")
		.find((part) => part.startsWith(`${name} `))
		?.slice(name.length + 1);
}

describe("buildCsp", () => {
	test("production: scripts need the nonce, no eval, no framing", () => {
		const csp = buildCsp({ nonce: "abc", dev: false });
		expect(directive(csp, "script-src")).toBe(
			"'self' 'nonce-abc' 'strict-dynamic'",
		);
		expect(directive(csp, "frame-ancestors")).toBe("'none'");
		expect(directive(csp, "object-src")).toBe("'none'");
		expect(directive(csp, "connect-src")).toBe("'self'");
		expect(csp).not.toContain("unsafe-eval");
	});

	test("development allows eval and the dev server WebSocket", () => {
		const csp = buildCsp({ nonce: "abc", dev: true });
		expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
		expect(directive(csp, "connect-src")).toBe("'self' ws: wss:");
	});

	test("an API on another origin is allowed by its origin only", () => {
		const csp = buildCsp({
			nonce: "abc",
			dev: false,
			serverUrl: "http://localhost:3000/some/path",
		});
		expect(directive(csp, "connect-src")).toBe("'self' http://localhost:3000");
	});

	test("an invalid server URL is ignored", () => {
		const csp = buildCsp({ nonce: "abc", dev: false, serverUrl: "nope" });
		expect(directive(csp, "connect-src")).toBe("'self'");
	});
});

describe("createNonce", () => {
	test("is base64 of 16 bytes and differs each time", () => {
		const a = createNonce();
		expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
		expect(createNonce()).not.toBe(a);
	});
});
