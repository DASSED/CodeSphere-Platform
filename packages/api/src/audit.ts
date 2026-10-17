import type { Database } from "@codesphere/db";
import type { AuditDetails } from "@codesphere/db/schema/audit";
import { type SQL, type SQLWrapper, sql } from "drizzle-orm";

export type AuditEvent = {
	actorId: string;
	/** `<entity>.<verb>`: hackathon.update, tag.rename, member.suspend... (#116). */
	action: string;
	targetType: string;
	/** Name of a column of the mutation's RETURNING list holding the target's id. */
	targetIdColumn?: string;
	/** The target's id when it is not the mutated row, e.g. a Milestone of the edited Hackathon. */
	targetId?: string;
	/** Field names and reason only, never personal values. */
	details?: AuditDetails;
};

const auditInsert = (event: AuditEvent) => {
	const targetId = event.targetIdColumn
		? sql`(m.${sql.identifier(event.targetIdColumn)})::text`
		: sql`${event.targetId ?? null}::text`;
	const details = event.details ? JSON.stringify(event.details) : null;
	return sql`
		INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
		SELECT ${event.actorId}, ${event.action}, ${event.targetType}, ${targetId}, ${details}::jsonb
		FROM m
		-- Guard: with 2+ rows, the CASE yields text and the CAST fails, aborting the statement.
		WHERE CAST(CASE WHEN (SELECT count(*) FROM m) > 1
			THEN 'one target per mutation' END AS integer) IS NULL
	`;
};

/**
 * Runs an admin mutation and writes its audit events in ONE statement (#122):
 *
 *   WITH m AS (<mutation> RETURNING ...),
 *        s0 AS (<step reading m>), ...
 *        a0 AS (INSERT INTO audit_log ... SELECT ... FROM m), ...
 *   SELECT * FROM m
 *
 * The Worker's HTTP driver has no transactions, but one statement is atomic anyway: either the
 * mutation, its steps and its events all land, or none does. A mutation that touches no row
 * writes no event (the `SELECT ... FROM m` is empty). A mutation that touches MORE than one row is
 * refused: each audit insert's guard fails the whole statement, so nothing is written. The mutation
 * must end with `.returning(...)`. `steps` are further writes on the target's children; they must
 * scope themselves to `m` (`WHERE parent_id IN (SELECT id FROM m)`) so they do nothing when the
 * mutation matched nothing.
 *
 * The rows come back raw from the driver: keyed by COLUMN name (`team_min`, not `teamMin`),
 * dates as strings. Callers map them.
 */
export async function withAudit(
	db: Database,
	events: AuditEvent | AuditEvent[],
	mutation: SQLWrapper,
	steps: SQL[] = [],
): Promise<Record<string, unknown>[]> {
	const ctes = [
		sql`m AS (${mutation.getSQL()})`,
		...steps.map((step, i) => sql`${sql.raw(`s${i}`)} AS (${step})`),
		...[events]
			.flat()
			.map((event, i) => sql`${sql.raw(`a${i}`)} AS (${auditInsert(event)})`),
	];
	const result = await db.execute(
		sql`WITH ${sql.join(ctes, sql`, `)} SELECT * FROM m`,
	);
	const rows = Array.isArray(result)
		? result
		: (result as { rows: Record<string, unknown>[] }).rows;
	return rows;
}
