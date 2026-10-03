import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base } from "./base";

export const MemberSummary = z.object({
	id: z.string(),
	name: z.string(),
	kind: z.enum(["human", "agent"]),
	ownerId: z.string().nullable(),
});

export const membersContract = {
	me: base
		.errors({ UNAUTHORIZED: {} })
		.meta(openapi({ method: "GET", path: "/me", tags: ["members"] }))
		.meta(
			mcp.tool({
				description: "Who am I? Returns the authenticated Member (human or agent).",
				annotations: { readOnlyHint: true },
			}),
		)
		.output(MemberSummary),
};
