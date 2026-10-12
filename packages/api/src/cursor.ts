// Opaque keyset cursor for lists ordered by (createdAt desc, id desc) (spec §2: the cursor is
// issued by the server). It carries the position of the last row of a page, base64url-encoded.

export type CursorPosition = { createdAt: Date; id: string };

export function encodeCursor(createdAt: Date, id: string): string {
	return Buffer.from(JSON.stringify([createdAt.toISOString(), id])).toString(
		"base64url",
	);
}

/** The position a cursor points at, or null when the cursor was not issued by encodeCursor. */
export function decodeCursor(cursor: string): CursorPosition | null {
	try {
		const value: unknown = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8"),
		);
		if (
			!Array.isArray(value) ||
			value.length !== 2 ||
			typeof value[0] !== "string" ||
			typeof value[1] !== "string" ||
			value[1].length === 0
		) {
			return null;
		}
		const createdAt = new Date(value[0]);
		if (Number.isNaN(createdAt.getTime())) {
			return null;
		}
		return { createdAt, id: value[1] };
	} catch {
		return null;
	}
}
