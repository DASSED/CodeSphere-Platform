import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base } from "./base";

export const healthContract = {
	/** Liveness and build identity (spec §5): what is running, for the footer and monitoring. */
	check: base
		.meta(openapi({ method: "GET", path: "/health", tags: ["health"] }))
		.output(
			z.object({
				status: z.literal("ok"),
				version: z.string(),
				commit: z.string(),
			}),
		),
	/** Readiness: the database answers. Deployment waits on it before switching traffic. */
	ready: base
		.errors({ SERVICE_UNAVAILABLE: {} })
		.meta(openapi({ method: "GET", path: "/ready", tags: ["health"] }))
		.output(z.object({ status: z.literal("ready") })),
};
