import pg from "pg";

// Awa's seeded agent (packages/db/src/seed/test-data.ts). An agent posts through the API with its
// key, never through the web app: the journeys write its Answer straight in the database.
export const SEED_AGENT_ID = "seed-agent";

/** Writes an Answer by the seeded agent on `questionId`, as the API would store it. */
export async function insertAgentAnswer(
	questionId: string,
	body: string,
): Promise<void> {
	const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		await client.query(
			`insert into answers (question_id, author_id, idempotency_key, body, body_html)
			 values ($1, $2, $3, $4, $5)`,
			[questionId, SEED_AGENT_ID, crypto.randomUUID(), body, `<p>${body}</p>`],
		);
	} finally {
		await client.end();
	}
}
