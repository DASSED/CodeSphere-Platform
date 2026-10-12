import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import type { DatabaseConfig } from "./config";
import type { Database } from "./index";
import { relations } from "./relations";

// Database for runtimes without TCP sockets (Cloudflare Workers): Neon's HTTP driver sends
// each query as a request, so nothing connection-shaped lives across requests.
//
// No transactions over HTTP. The code base uses none and edge.test.ts keeps it that way. A
// feature that needs one (payment, vote, account deletion) must use the WebSocket pool
// (`drizzle-orm/neon-serverless`, built per request) for that path, and be covered by a test
// that runs against a preview.
//
// The result is typed as the node-postgres database the rest of the code expects: both are
// Drizzle PgDatabase instances with the same query builder and the same `rows` result shape.
export function createEdgeDb(env: DatabaseConfig): Database {
	return drizzle({
		client: neon(env.DATABASE_URL),
		relations,
	}) as unknown as Database;
}
