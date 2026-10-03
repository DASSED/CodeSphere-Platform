import { contract } from "@codesphere/contract";
import { implement } from "@orpc/server";

import type { Context } from "./context";

/** Implementer locked to the shared contract: every handler is type-checked against it. */
export const impl = implement(contract).$context<Context>();
