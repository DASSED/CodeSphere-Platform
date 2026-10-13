import { describe, expect, test } from "bun:test";

import { decodeHotCursor, encodeHotCursor, hotScore } from "./feed";

describe("hotScore", () => {
	test("matches (score + 1) / (age + 2)^1.5", () => {
		expect(hotScore(0, 0)).toBeCloseTo(1 / 2 ** 1.5, 10);
		expect(hotScore(9, 2)).toBeCloseTo(10 / 4 ** 1.5, 10);
	});

	test("rises with votes and decays with age", () => {
		expect(hotScore(5, 3)).toBeGreaterThan(hotScore(1, 3));
		expect(hotScore(5, 3)).toBeGreaterThan(hotScore(5, 30));
	});

	test("a net score of -1 sinks to zero, below an unvoted Question of the same age", () => {
		expect(hotScore(-1, 4)).toBe(0);
		expect(hotScore(-1, 4)).toBeLessThan(hotScore(0, 4));
	});

	test("an age before the snapshot is clamped to zero", () => {
		expect(hotScore(0, -5)).toBe(hotScore(0, 0));
	});
});

describe("hot cursor", () => {
	const cursor = {
		snapshotAt: new Date("2026-10-13T12:00:00.000Z"),
		hot: 0.35355339059327373,
		id: "0197b2a8-0000-7000-8000-000000000001",
	};

	test("round-trips the snapshot, the score and the id exactly", () => {
		expect(decodeHotCursor(encodeHotCursor(cursor))).toEqual(cursor);
	});

	test("rejects anything not issued by encodeHotCursor", () => {
		for (const bad of [
			"",
			"not-a-cursor",
			Buffer.from("{}").toString("base64url"),
			Buffer.from('["x",1,"id"]').toString("base64url"),
			Buffer.from('["2026-10-13T12:00:00.000Z","1","id"]').toString(
				"base64url",
			),
			Buffer.from('["2026-10-13T12:00:00.000Z",1,""]').toString("base64url"),
		]) {
			expect(decodeHotCursor(bad)).toBeNull();
		}
	});

	test("(hot desc, id desc) is a total order, so pages never repeat or skip a row", () => {
		const rows = [
			{ hot: hotScore(0, 1), id: "c" },
			{ hot: hotScore(3, 1), id: "a" },
			{ hot: hotScore(3, 1), id: "b" },
		].sort((x, y) => y.hot - x.hot || (x.id < y.id ? 1 : -1));
		expect(rows.map((r) => r.id)).toEqual(["b", "a", "c"]);
		const first = rows[0] as { hot: number; id: string };
		// A cursor on `b` leaves exactly `a` and `c` after it.
		const after = rows.filter(
			(r) => r.hot < first.hot || (r.hot === first.hot && r.id < first.id),
		);
		expect(after.map((r) => r.id)).toEqual(["a", "c"]);
	});
});
