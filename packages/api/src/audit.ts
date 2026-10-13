import type { Database } from "@codesphere/db";
import type { AuditDetails } from "@codesphere/db/schema/audit";
import { type SQLWrapper, sql } from "drizzle-orm";

export type AuditEvent = {
	actorId: string;
	/** `<entity>.<verb>`: hackathon.update, tag.rename, member.suspend... (#116). */
	action: string;
	targetType: string;
	/** Name of a column of the mutation's RETURNING list holding the target's id. */
	targetIdColumn?: string;
	/** Field names and reason only, never personal values. */
	details?: AuditDetails;
};

/**
 * Runs an admin mutation and writes its audit event in ONE statement (#122):
 *
 *   WITH m AS (<mutation> RETURNING ...),
 *        a AS (INSERT INTO audit_log ... SELECT ... FROM m)
 *   SELECT * FROM m
 *
 * The Worker's HTTP driver has no transactions, but one statement is atomic anyway: either the
 * mutation and its event both land, or neither does. A mutation that touches no row writes no
 * event (the `SELECT ... FROM m` is empty). A mutation that touches MORE than one row is refused:
 * the audit insert's guard fails the whole statement, so nothing is written. The mutation must
 * end with `.returning(...)`.
 *
 * The rows come back raw from the driver: keyed by COLUMN name (`team_min`, not `teamMin`),
 * dates as strings. Callers map them.
 */
export async function withAudit(
	db: Database,
	event: AuditEvent,
	mutation: SQLWrapper,
): Promise<Record<string, unknown>[]> {
	const targetId = event.targetIdColumn
		? sql`(m.${sql.identifier(event.targetIdColumn)})::text`
		: sql`NULL::text`;
	const details = event.details ? JSON.stringify(event.details) : null;
	const result = await db.execute(sql`
		WITH m AS (${mutation.getSQL()}),
		a AS (
			INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
			SELECT ${event.actorId}, ${event.action}, ${event.targetType}, ${targetId}, ${details}::jsonb
			FROM m
			-- Guard: with 2+ rows, the CASE yields text and the CAST fails, aborting the statement.
			WHERE CAST(CASE WHEN (SELECT count(*) FROM m) > 1
				THEN 'one target per mutation' END AS integer) IS NULL
		)
		SELECT * FROM m
	`);
	const rows = Array.isArray(result)
		? result
		: (result as { rows: Record<string, unknown>[] }).rows;
	return rows;
}
