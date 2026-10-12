import { createLogger } from "@codesphere/logger";

import type { Context } from "./context";

// Any query on it throws, like a database that is down.
const unavailableDb = new Proxy({} as Context["db"], {
	get() {
		throw new Error("database unavailable (test)");
	},
});

/**
 * A procedure context for tests: a silent logger, a fixed request id and build identity,
 * no session and a database that fails on any query. Override what a test exercises.
 */
export function testContext(overrides: Partial<Context> = {}): Context {
	return {
		session: null,
		db: unavailableDb,
		logger: createLogger({ level: "silent" }),
		requestId: "test",
		release: { version: "test", commit: "test" },
		...overrides,
	};
}
