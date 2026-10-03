import { createAuth } from "@systalink-challenge/auth";
import { createDb } from "@systalink-challenge/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
