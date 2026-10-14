import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base } from "./base";

/** Normalized name of a Tag: trimmed and lowercase, so `JavaScript ` and `javascript` are one Tag. */
export const TagSlug = z.string().trim().toLowerCase().min(1).max(40);

export const TagSummary = z.object({
	name: z.string(),
	/** Live (not deleted) Questions that carry the Tag, whatever their status. */
	questionCount: z.number().int().min(0),
	/** Whether the signed-in Member follows it; always false without a session. */
	followed: z.boolean(),
});

export const TagSearchInput = z.object({
	/** Part of a name; normalized by the server. Empty or absent: the most used Tags. */
	q: z.string().max(40).optional(),
	limit: z.number().int().min(1).max(50).default(20),
});

export const tagsContract = {
	search: base
		.meta(
			openapi({
				method: "GET",
				path: "/tags",
				tags: ["tags"],
				summary: "Search Tags",
				description:
					"Tags whose name contains the query, most used first. Public: `followed` is only meaningful with a session or an API key.",
			}),
		)
		.meta(
			mcp.tool({
				description:
					"Search Tags by name, most used first. Use them to label a Question.",
				annotations: { readOnlyHint: true },
			}),
		)
		.input(TagSearchInput)
		.output(z.object({ items: z.array(TagSummary) })),
	followed: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "GET",
				path: "/me/tags",
				tags: ["tags"],
				summary: "List the Tags I follow",
				description:
					"The Tags the signed-in Member follows. Requires a session or an API key.",
			}),
		)
		.output(z.object({ items: z.array(TagSummary) })),
	follow: base
		.errors({ UNAUTHORIZED: {}, NOT_FOUND: {} })
		.meta(
			openapi({
				method: "POST",
				path: "/me/tags",
				tags: ["tags"],
				summary: "Follow a Tag",
				description:
					"Idempotent: following a Tag already followed changes nothing. NOT_FOUND for a Tag that does not exist.",
			}),
		)
		.input(z.object({ tag: TagSlug }))
		.output(TagSummary),
	skipOnboarding: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "POST",
				path: "/me/tags/onboarding/skip",
				tags: ["tags"],
				summary: "Skip the Tags onboarding",
				description:
					"Records that the Member passed the Tags onboarding, so the app stops offering it. Idempotent.",
			}),
		)
		.output(z.object({ success: z.boolean() })),
	unfollow: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "DELETE",
				path: "/me/tags/{tag}",
				tags: ["tags"],
				summary: "Unfollow a Tag",
				description:
					"Idempotent: unfollowing a Tag that is not followed changes nothing.",
			}),
		)
		.input(z.object({ tag: TagSlug }))
		.output(z.object({ success: z.boolean() })),
};

export type TagSummary = z.infer<typeof TagSummary>;
