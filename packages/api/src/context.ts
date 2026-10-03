import type { Session } from "@systalink-challenge/auth";
import type { Database } from "@systalink-challenge/db";

export type Context = {
  session: Session | null;
  db: Database;
};
