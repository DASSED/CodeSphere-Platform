import type { Session } from "@codesphere/auth";
import type { Database } from "@codesphere/db";

export type Context = {
  session: Session | null;
  db: Database;
};
