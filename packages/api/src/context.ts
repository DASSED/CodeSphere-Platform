import type { Session } from "@codesphere/auth";
import type { Database } from "@codesphere/db";
import type { Logger } from "@codesphere/logger";

export type Context = {
	session: Session | null;
	db: Database;
	/** Child logger bound to the request id (#59). */
	logger: Logger;
	/** Id of the HTTP request, returned in `x-request-id` and in INTERNAL_SERVER_ERROR. */
	requestId: string;
	/** Build identity injected at build time (APP_VERSION, GIT_SHA). */
	release: { version: string; commit: string };
};
