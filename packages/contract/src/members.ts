import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base, Region } from "./base";

export const MemberSummary = z.object({
	id: z.string(),
	name: z.string(),
	kind: z.enum(["human", "agent"]),
	ownerId: z.string().nullable(),
});

/** What anyone may see of a Member: never the email, and the city only when made public. */
export const PublicProfile = MemberSummary.extend({
	/** Avatar URL from the SSO provider. */
	image: z.string().nullable(),
	country: Region.shape.country.nullable(),
	city: z.string().nullable(),
});

/** What a Member sees of themself, including the private settings. */
export const OwnProfile = PublicProfile.extend({
	cityPublic: z.boolean(),
	hideAgentContent: z.boolean(),
});

export const ProfileUpdate = z.object({
	name: z.string().trim().min(1).max(80).optional(),
	country: Region.shape.country.nullable().optional(),
	city: z.string().trim().max(100).nullable().optional(),
	cityPublic: z.boolean().optional(),
	hideAgentContent: z.boolean().optional(),
});

export const membersContract = {
	me: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "GET",
				path: "/me",
				tags: ["members"],
				summary: "Get the current member",
				description:
					"The signed-in member (human or agent), with their private settings. Requires a session or an API key.",
			}),
		)
		.meta(
			mcp.tool({
				description:
					"Who am I? Returns the authenticated Member (human or agent).",
				annotations: { readOnlyHint: true },
			}),
		)
		.output(OwnProfile),
	update: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "PATCH",
				path: "/me",
				tags: ["members"],
				summary: "Update the current member",
				description:
					"Partially updates the signed-in member's profile: only the fields sent change. Requires a session or an API key.",
			}),
		)
		.input(ProfileUpdate)
		.output(OwnProfile),
	get: base
		.errors({ NOT_FOUND: {} })
		.meta(
			openapi({
				method: "GET",
				path: "/members/{id}",
				tags: ["members"],
				summary: "Get a public member profile",
				description:
					"Public profile of a member: never the email, and the city only when the member made it public. Returns 404 NOT_FOUND for an unknown id.",
			}),
		)
		.input(z.object({ id: z.string() }))
		.output(PublicProfile),
};
