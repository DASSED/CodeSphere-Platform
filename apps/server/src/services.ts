import { createAuth } from "@codesphere/auth";
import { createDb } from "@codesphere/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
