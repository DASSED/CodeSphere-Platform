import type { contract } from "@codesphere/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterContractClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ErrorCode, errorCodeOf } from "../i18n/errors";
import { PERSIST_MAX_AGE } from "../lib/persist";
import { getServerUrl } from "../lib/server-url";

// `translate` maps an oRPC error code to the visitor's language (see messages/<locale>.json "errors").
export function createQueryClient(
	translate: (code: ErrorCode) => string,
	retryLabel: string,
) {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				// A query that has its own fallback (a Markdown preview) opts out of the toast.
				if (query.meta?.silent) {
					return;
				}
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
		defaultOptions: {
			queries: { staleTime: 60 * 1000, gcTime: PERSIST_MAX_AGE },
		},
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

export const client: RouterContractClient<typeof contract> =
	createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
