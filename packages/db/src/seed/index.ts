// `bun run db:seed`: applies the starting values to the database of DATABASE_URL. Idempotent.
import "varlock/auto-load";

import { createDb } from "../index";
import { seed } from "./seed";

const url = process.env.DATABASE_URL;
if (!url) {
	console.error("DATABASE_URL is not set.");
	process.exit(1);
}

const db = createDb({ DATABASE_URL: url });
const result = await seed(db);
console.info("seed:", result);
await db.$client.end();
