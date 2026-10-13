// The hot score and the keyset cursor of the For You feed (#65, spec §2).
//
// score_chaud = (Score + 1) / (age_h + 2)^1.5, computed in SQL so the database orders and pages.
// The cursor carries `snapshotAt` (the instant the first page was read) plus the last row's
// `(hot, id)`: ages are measured at `snapshotAt` and later Questions are excluded, so the order is
// the same on every page.

export const HOT_GRAVITY = 1.5;

/** The hot score of a Question; the SQL expression in the listing service computes the same. */
export function hotScore(score: number, ageHours: number): number {
	return (score + 1) / (Math.max(ageHours, 0) + 2) ** HOT_GRAVITY;
}

export type HotCursor = { snapshotAt: Date; hot: number; id: string };

export function encodeHotCursor(cursor: HotCursor): string {
	return Buffer.from(
		JSON.stringify([cursor.snapshotAt.toISOString(), cursor.hot, cursor.id]),
	).toString("base64url");
}

/** The position a cursor points at, or null when the cursor was not issued by encodeHotCursor. */
export function decodeHotCursor(cursor: string): HotCursor | null {
	try {
		const value: unknown = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8"),
		);
		if (
			!Array.isArray(value) ||
			value.length !== 3 ||
			typeof value[0] !== "string" ||
			typeof value[1] !== "number" ||
			!Number.isFinite(value[1]) ||
			typeof value[2] !== "string" ||
			value[2].length === 0
		) {
			return null;
		}
		const snapshotAt = new Date(value[0]);
		if (Number.isNaN(snapshotAt.getTime())) {
			return null;
		}
		return { snapshotAt, hot: value[1], id: value[2] };
	} catch {
		return null;
	}
}
