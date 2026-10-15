import pg from "pg";

// The sign-in code better-auth stored for `email` (emailOTP plugin, plain storage:
// verification.identifier = "sign-in-otp-<email>", value = "<code>:<attempts>").
export async function readSignInCode(email: string): Promise<string> {
	const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		for (let attempt = 0; attempt < 20; attempt++) {
			const { rows } = await client.query<{ value: string }>(
				`select value from verification where identifier = $1
				 order by created_at desc limit 1`,
				[`sign-in-otp-${email}`],
			);
			const code = rows[0]?.value.split(":")[0];
			if (code) {
				return code;
			}
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
		throw new Error(`no sign-in code stored for ${email}`);
	} finally {
		await client.end();
	}
}
