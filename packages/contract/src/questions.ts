import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base, Id, IdempotencyKey, ExpectedVersion, Markdown } from "./base";

export const QuestionSummary = z.object({
	id: Id,
	title: z.string().min(1).max(200),
	authorId: Id,
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
		.meta(openapi({ method: "POST", path: "/questions", tags: ["questions"] }))
		.meta(
			mcp.tool({
				description: "Post a new Question to the platform.",
			}),
		)
		.input(CreateQuestionInput)
		.output(QuestionDetail),

	get: base
		.errors({ NOT_FOUND: {} })
		.meta(openapi({ method: "GET", path: "/questions/{id}", tags: ["questions"] }))
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
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(openapi({ method: "PATCH", path: "/questions/{id}", tags: ["questions"] }))
		.input(UpdateQuestionInput)
		.output(QuestionDetail),

	close: base
		.errors({
			UNAUTHORIZED: {},
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(openapi({ method: "POST", path: "/questions/{id}/close", tags: ["questions"] }))
		.input(CloseQuestionInput)
		.output(QuestionSummary),

	delete: base
		.errors({
			UNAUTHORIZED: {},
			NOT_FOUND: {},
			CONFLICT: { data: z.object({ version: z.number() }) },
		})
		.meta(openapi({ method: "DELETE", path: "/questions/{id}", tags: ["questions"] }))
		.input(z.object({ id: Id, expectedVersion: ExpectedVersion }))
		.output(z.object({ success: z.boolean() })),
};

export type QuestionDetail = z.infer<typeof QuestionDetail>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionInput>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInput>;
