import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base, ExpectedVersion, Id, IdempotencyKey, Markdown } from "./base";

export const QuestionSummary = z.object({
	id: Id,
	title: z.string().min(1).max(200),
	authorId: z.string().min(1),
	language: z.enum(["fr", "en"]),
	status: z.enum(["open", "answered", "closed"]),
	tags: z.array(z.string().toLowerCase().trim()),
	version: z.number().int().min(1),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const QuestionDetail = QuestionSummary.extend({
	body: Markdown,
	bodyHtml: z.string(),
});

export const CreateQuestionInput = z.object({
	idempotencyKey: IdempotencyKey,
	title: z.string().trim().min(1).max(200),
	body: Markdown,
	language: z.enum(["fr", "en"]),
	tags: z.array(z.string().toLowerCase().trim()).min(1).max(5),
});

export const UpdateQuestionInput = z.object({
	id: Id,
	expectedVersion: ExpectedVersion,
	title: z.string().trim().min(1).max(200).optional(),
	body: Markdown.optional(),
	language: z.enum(["fr", "en"]).optional(),
	tags: z.array(z.string().toLowerCase().trim()).min(1).max(5).optional(),
});

export const CloseQuestionInput = z.object({
	id: Id,
	expectedVersion: ExpectedVersion,
});

export const questionsContract = {
	create: base
		.errors({ UNAUTHORIZED: {} })
		.meta(
			openapi({
				method: "POST",
				path: "/questions",
				tags: ["questions"],
				summary: "Ask a question",
				description:
					"Creates a question. The idempotencyKey makes a retry safe (offline outbox). Requires a session or an API key.",
			}),
		)
		.meta(
			mcp.tool({
				description: "Ask a new Question on the platform.",
			}),
		)
		.input(CreateQuestionInput)
		.output(QuestionDetail),

	get: base
		.errors({ NOT_FOUND: {} })
		.meta(
			openapi({
				method: "GET",
				path: "/questions/{id}",
				tags: ["questions"],
				summary: "Get a question",
				description:
					"One question with its Markdown body and rendered HTML. Returns 404 NOT_FOUND for an unknown id.",
			}),
		)
		.meta(
			mcp.tool({
				description: "Fetch a single Question by ID.",
				annotations: { readOnlyHint: true },
			}),
		)
		.input(z.object({ id: Id }))
		.output(QuestionDetail),

	update: base
		.errors({
			UNAUTHORIZED: {},
			FORBIDDEN: {},
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(
			openapi({
				method: "PATCH",
				path: "/questions/{id}",
				tags: ["questions"],
				summary: "Update a question",
				description:
					"Partial update, author only. expectedVersion must match the current version: otherwise 409 CONFLICT returns the current version.",
			}),
		)
		.input(UpdateQuestionInput)
		.output(QuestionDetail),

	close: base
		.errors({
			UNAUTHORIZED: {},
			FORBIDDEN: {},
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(
			openapi({
				method: "POST",
				path: "/questions/{id}/close",
				tags: ["questions"],
				summary: "Close a question",
				description:
					"Closes a question. Allowed for its author or an admin. expectedVersion guards against a stale write (409 CONFLICT).",
			}),
		)
		.input(CloseQuestionInput)
		.output(QuestionSummary),

	delete: base
		.errors({
			UNAUTHORIZED: {},
			FORBIDDEN: {},
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(
			openapi({
				method: "DELETE",
				path: "/questions/{id}",
				tags: ["questions"],
				summary: "Delete a question",
				description:
					"Deletes a question, author only. expectedVersion guards against a stale write (409 CONFLICT).",
			}),
		)
		.input(z.object({ id: Id, expectedVersion: ExpectedVersion }))
		.output(z.object({ success: z.boolean() })),
};

export type QuestionDetail = z.infer<typeof QuestionDetail>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInput>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInput>;
