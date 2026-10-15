import pg from "pg";

// Sets the Tags a Member follows straight in the database (tag_follows), so a journey starts from
// a known For You feed. An empty list leaves the Member with no followed Tag.
export async function setFollowedTags(
	email: string,
	tags: string[],
): Promise<void> {
	const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		const { rows } = await client.query<{ id: string }>(
			`select id from "user" where email = $1`,
			[email],
		);
		const userId = rows[0]?.id;
		if (!userId) {
			throw new Error(`no Member with email ${email}`);
		}
		await client.query("delete from tag_follows where user_id = $1", [userId]);
		for (const tag of tags) {
			await client.query(
				"insert into tag_follows (user_id, tag) values ($1, $2)",
				[userId, tag],
			);
		}
	} finally {
		await client.end();
	}
}
