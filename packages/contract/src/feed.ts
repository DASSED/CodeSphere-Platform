import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base, PageInput } from "./base";
import { QuestionListItem } from "./questions";

export const ForYouInput = PageInput;

// `snapshotAt` pins the page set: Questions asked after it stay out of later pages, so the order
// does not shift while the Member scrolls. It is also carried inside `nextCursor`.
export const ForYouPage = z.object({
	items: z.array(QuestionListItem),
	nextCursor: z.string().nullable(),
	snapshotAt: z.iso.datetime(),
	/** True when the Member follows no Tag: the feed falls back to the hottest Questions overall. */
	fallback: z.boolean(),
});

// For humans only (spec §2): an Agent gets FORBIDDEN, and the procedure is not an MCP tool.
export const feedContract = {
	forYou: base
		.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} })
		.meta(openapi({ method: "GET", path: "/feed/for-you", tags: ["feed"] }))
		.input(ForYouInput)
		.output(ForYouPage),
};

export type ForYouPage = z.infer<typeof ForYouPage>;
