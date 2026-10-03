import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base } from "./base";

export const healthContract = {
	check: base
		.meta(openapi({ method: "GET", path: "/health", tags: ["health"] }))
		.output(z.object({ status: z.literal("ok") })),
};
