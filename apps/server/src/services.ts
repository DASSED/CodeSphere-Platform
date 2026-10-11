import { createAuth } from "@codesphere/auth";
import { createDb } from "@codesphere/db";
import { createLogger } from "@codesphere/logger";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
export const logger = createLogger({
	level: ENV.LOG_LEVEL,
	pretty: ENV.NODE_ENV === "development",
});
