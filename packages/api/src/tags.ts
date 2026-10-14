import type { Database } from "@codesphere/db";
import { sql } from "drizzle-orm";

const rowsOf = <T>(result: unknown): T[] =>
	(Array.isArray(result)
		? result
		: (result as { rows: unknown[] }).rows) as T[];

type TagRow = { name: string; questionCount: number; followed: boolean };

const summary = (row: TagRow) => ({
	name: row.name,
	questionCount: Number(row.questionCount),
	followed: Boolean(row.followed),
});

/** Escapes LIKE wildcards so a typed `%` or `_` matches itself. */
const likePattern = (text: string) =>
	`%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

// A Tag with its usage count (live Questions) and whether `userId` follows it.
const selectTags = (userId: string | null, where = sql``, limit = 50) => sql`
	SELECT t.name,
		(SELECT count(*)::int FROM questions q
			WHERE q.deleted_at IS NULL AND t.name = ANY (q.tags)) AS "questionCount",
		EXISTS (SELECT 1 FROM tag_follows f
			WHERE f.tag = t.name AND f.user_id = ${userId}) AS "followed"
	FROM tag t ${where}
	ORDER BY "questionCount" DESC, t.name
	LIMIT ${limit}`;

/** Tags whose name contains `q`, most used first. `userId` is null for an anonymous caller. */
export async function searchTags(
	db: Database,
	input: { q?: string; limit: number },
	userId: string | null,
) {
	const where = input.q
		? sql`WHERE t.name ILIKE ${likePattern(input.q)}`
		: sql``;
	const rows = rowsOf<TagRow>(
		await db.execute(selectTags(userId, where, input.limit)),
	);
	return rows.map(summary);
}

/** The Tags a Member follows. */
export async function followedTags(db: Database, userId: string) {
	const rows = rowsOf<TagRow>(
		await db.execute(
			selectTags(
				userId,
				sql`WHERE t.name IN (SELECT tag FROM tag_follows WHERE user_id = ${userId})`,
				200,
			),
		),
	);
	return rows.map(summary);
}

/**
 * Follows a Tag; idempotent. `null` when the Tag does not exist. One statement: the follow is
 * inserted only for an existing Tag, and a repeated follow hits the primary key and does nothing.
 */
export async function followTag(db: Database, userId: string, name: string) {
	await db.execute(sql`
		INSERT INTO tag_follows (user_id, tag)
		SELECT ${userId}, t.name FROM tag t WHERE t.name = ${name}
		ON CONFLICT DO NOTHING`);
	const [row] = rowsOf<TagRow>(
		await db.execute(selectTags(userId, sql`WHERE t.name = ${name}`, 1)),
	);
	return row ? summary(row) : null;
}

/** Unfollows a Tag; idempotent. */
export async function unfollowTag(db: Database, userId: string, name: string) {
	await db.execute(
		sql`DELETE FROM tag_follows WHERE user_id = ${userId} AND tag = ${name}`,
	);
}

/** Makes sure every Tag of a Question exists as an official Tag row; idempotent (#44). */
export async function ensureTags(db: Database, names: readonly string[]) {
	if (names.length === 0) {
		return;
	}
	await db.execute(sql`
		INSERT INTO tag (name)
		SELECT DISTINCT trim(lower(n)) FROM unnest(ARRAY[${sql.join(
			names.map((name) => sql`${name}`),
			sql`, `,
		)}]::text[]) AS n
		WHERE trim(n) <> ''
		ON CONFLICT (name) DO NOTHING`);
}
