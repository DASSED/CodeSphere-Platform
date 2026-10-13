import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base } from "./base";

export const healthContract = {
	/** Liveness and build identity (spec §5): what is running, for the footer and monitoring. */
	check: base
		.meta(
			openapi({
				method: "GET",
				path: "/health",
				tags: ["health"],
				summary: "Liveness",
				description:
					"Reports that the process runs, with its build identity (version and commit). Does not touch the database.",
			}),
		)
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
		.meta(
			openapi({
				method: "GET",
				path: "/ready",
				tags: ["health"],
				summary: "Readiness",
				description:
					"Reports whether the database answers. Returns 503 SERVICE_UNAVAILABLE when it does not; deployments wait on it before switching traffic.",
			}),
		)
		.output(z.object({ status: z.literal("ready") })),
};
