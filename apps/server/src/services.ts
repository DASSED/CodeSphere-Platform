import { createAuth } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { createLogger } from "@codesphere/logger";

import { ENV } from "./env.server";
import { createMailHooks } from "./mail";

export const db = createDb(ENV);
export const logger = createLogger({
	level: ENV.LOG_LEVEL,
	pretty: ENV.NODE_ENV === "development",
});
export const auth = createAuth(
	ENV,
	db,
	[],
	createMailHooks(ENV, logger, ENV.NODE_ENV === "development"),
);
