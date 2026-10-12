import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

export function createDb(env: DatabaseConfig) {
	return drizzle({
		connection: {
			connectionString: env.DATABASE_URL,
			// Fail fast when the host does not answer, so /ready reports SERVICE_UNAVAILABLE
			// within the healthcheck timeout instead of hanging (#60).
			connectionTimeoutMillis: 3_000,
		},
		relations,
	});
}

export type Database = ReturnType<typeof createDb>;
