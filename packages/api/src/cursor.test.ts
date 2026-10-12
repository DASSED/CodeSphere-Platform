/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { decodeCursor, encodeCursor } from "./cursor";

describe("keyset cursor (createdAt, id)", () => {
	test("round-trips the position of the last row", () => {
		const at = new Date("2026-10-11T22:00:00.123Z");
		const cursor = encodeCursor(at, "0199-uuid");
		expect(decodeCursor(cursor)).toEqual({ createdAt: at, id: "0199-uuid" });
	});

	test("is opaque: no raw date or id in clear text", () => {
		const cursor = encodeCursor(new Date("2026-10-11T22:00:00Z"), "abc");
		expect(cursor).not.toContain("2026");
		expect(cursor).not.toContain("abc");
	});

	test("rejects anything it did not issue", () => {
		expect(decodeCursor("not-a-cursor")).toBeNull();
		expect(
			decodeCursor(Buffer.from('["nope","x"]').toString("base64url")),
		).toBeNull();
		expect(
			decodeCursor(Buffer.from('{"a":1}').toString("base64url")),
		).toBeNull();
		expect(decodeCursor("")).toBeNull();
	});
});
