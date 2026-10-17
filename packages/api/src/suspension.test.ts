/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Session } from "@codesphere/auth";

import { carriesApiKey, isSuspended, sessionForRequest } from "./suspension";

const session = (suspendedAt: Date | null): Session =>
	({
		user: { id: "u1", suspendedAt },
		session: { id: "s1" },
	}) as unknown as Session;

describe("sessionForRequest", () => {
	test("drops the session of a suspended Member on an API key", () => {
		expect(sessionForRequest(session(new Date()), true)).toBeNull();
	});

	test("keeps the web session of a suspended Member, who may still read", () => {
		const web = session(new Date());
		expect(sessionForRequest(web, false)).toBe(web);
	});

	test("keeps an active Member's API-key session", () => {
		const active = session(null);
		expect(sessionForRequest(active, true)).toBe(active);
	});
});

describe("isSuspended", () => {
	test("is false without a session", () => {
		expect(isSuspended(null)).toBe(false);
	});
});

describe("carriesApiKey", () => {
	test("recognises x-api-key and Bearer, not a cookie", () => {
		expect(carriesApiKey(new Headers({ "x-api-key": "k" }))).toBe(true);
		expect(carriesApiKey(new Headers({ authorization: "Bearer k" }))).toBe(
			true,
		);
		expect(carriesApiKey(new Headers({ cookie: "a=b" }))).toBe(false);
	});
});
