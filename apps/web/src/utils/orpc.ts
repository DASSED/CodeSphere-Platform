import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { contract } from "@codesphere/contract";
import type { RouterContractClient } from "@orpc/contract";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorCodeOf, type ErrorCode } from "../i18n/errors";
import { getServerUrl } from "../lib/server-url";
import { PERSIST_MAX_AGE } from "../lib/persist";

// `translate` maps an oRPC error code to the visitor's language (see messages/<locale>.json "errors").
export function createQueryClient(translate: (code: ErrorCode) => string, retryLabel: string) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(translate(errorCodeOf(error)), {
          action: {
            label: retryLabel,
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
    defaultOptions: { queries: { staleTime: 60 * 1000, gcTime: PERSIST_MAX_AGE } },
  });
}

const link = new RPCLink({
  origin: getServerUrl(),
  url: "/rpc",
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
  headers: async () => {
    if (typeof window !== "undefined") {
      return {};
    }

    // Server-side render: forward the visitor's cookies to the API.
    const { headers } = await import("next/headers");
    return Object.fromEntries(await headers());
  },
});

export const client: RouterContractClient<typeof contract> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
