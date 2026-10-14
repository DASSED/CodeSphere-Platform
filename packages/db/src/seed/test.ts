// `bun run db:seed:test`: applies the deterministic test data (#61) to the database of
// DATABASE_URL. Idempotent. Never run it against staging or production.
import "varlock/auto-load";

import { createDb } from "../index";
import { seed } from "./seed";
import { seedTestData } from "./test-data";

const url = process.env.DATABASE_URL;
if (!url) {
	console.error("DATABASE_URL is not set.");
	process.exit(1);
}

const db = createDb({ DATABASE_URL: url });
// The starting values first: the test questions use the starter Tags.
console.info("seed:", await seed(db));
console.info("test seed:", await seedTestData(db));
await db.$client.end();
