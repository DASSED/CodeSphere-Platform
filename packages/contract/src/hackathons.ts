import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base, Page, PageInput, Timestamp } from "./base";

export const Milestone = z.object({
	key: z.string(),
	label: z.string(),
	startsAt: Timestamp,
	endsAt: Timestamp.nullable(),
});

export const Hackathon = z.object({
	slug: z.string(),
	name: z.string(),
	organizer: z.string(),
	summary: z.string(),
	teamMin: z.number().int(),
	teamMax: z.number().int(),
	milestones: z.array(Milestone),
	sourceUrl: z.url(),
	verifiedAt: Timestamp,
});

export const hackathonsContract = {
	list: base
		.meta(openapi({ method: "GET", path: "/hackathons", tags: ["hackathons"] }))
		.meta(
			mcp.tool({
				description: "List hackathons (dates, rules, team size) known to CodeSphere.",
				annotations: { readOnlyHint: true },
			}),
		)
		.input(PageInput)
		.output(Page(Hackathon)),
	get: base
		.errors({ NOT_FOUND: {} })
		.meta(
			openapi({ method: "GET", path: "/hackathons/{slug}", tags: ["hackathons"] }),
		)
		.meta(
			mcp.tool({
				description: "Get one hackathon by slug, e.g. cadev-2026.",
				annotations: { readOnlyHint: true },
			}),
		)
		.input(z.object({ slug: z.string() }))
		.output(Hackathon),
};
