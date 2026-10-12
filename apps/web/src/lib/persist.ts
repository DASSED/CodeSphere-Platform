import type { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const STORE_KEY = "codesphere:query-cache";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/** Bump with the contract version so a stale cache is dropped after a breaking change. */
const BUSTER = "contract-v0";

/** Only reads of these root procedures are persisted (whitelist, see local-first ticket). */
const PERSISTED_ROOTS = new Set(["hackathons", "feed", "questions", "answers", "tags"]);

export const PERSIST_MAX_AGE = SEVEN_DAYS;

/**
 * Persist the Query cache to IndexedDB, in the browser only. Call it once from
 * the client `Providers` with the QueryClient it created.
 */
export function setupPersistence(queryClient: QueryClient) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  persistQueryClient({
    queryClient,
    maxAge: SEVEN_DAYS,
    buster: BUSTER,
    persister: {
      persistClient: (client) => set(STORE_KEY, client),
      restoreClient: () => get(STORE_KEY),
      removeClient: () => del(STORE_KEY),
    },
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        if (query.state.status !== "success") {
          return false;
        }
        const root = Array.isArray(query.queryKey[0]) ? query.queryKey[0][0] : undefined;
        return typeof root === "string" && PERSISTED_ROOTS.has(root);
      },
    },
  });
}

/** Wipe local data on logout or account switch. */
export async function clearPersistedCache(queryClient: QueryClient) {
  queryClient.clear();
  await del(STORE_KEY);
}
