import { requireAdmin } from "../authorization";
import { impl } from "../index";
import { createQuestionService, QuestionError } from "./service";

// Each request builds its service from the request's database (context.db), as the other routers do.
export function createQuestionsHandlers() {
	return {
		create: impl.questions.create.handler(
			async ({ context, input, errors }) => {
				const userId = context.session?.user.id;
				if (!userId) {
					throw errors.UNAUTHORIZED();
				}

				try {
					return await createQuestionService(context.db).createQuestion(
						userId,
						input,
					);
				} catch (err) {
					if (err instanceof QuestionError && err.code === "VALIDATION") {
						throw errors.BAD_REQUEST({
							data: {
								issues: [{ path: ["tags"], message: "Tags must be 1–5" }],
							},
						});
					}
					throw err;
				}
			},
		),

		get: impl.questions.get.handler(async ({ context, input, errors }) => {
			try {
				return await createQuestionService(context.db).getQuestion(input.id);
			} catch (err) {
				if (err instanceof QuestionError && err.code === "NOT_FOUND") {
					throw errors.NOT_FOUND();
				}
				throw err;
			}
		}),

		update: impl.questions.update.handler(
			async ({ context, input, errors }) => {
				const userId = context.session?.user.id;
				if (!userId) {
					throw errors.UNAUTHORIZED();
				}

				try {
					return await createQuestionService(context.db).updateQuestion(
						userId,
						input,
					);
				} catch (err) {
					if (err instanceof QuestionError) {
						if (err.code === "NOT_FOUND") throw errors.NOT_FOUND();
						if (err.code === "FORBIDDEN") throw errors.FORBIDDEN();
						if (err.code === "CONFLICT") {
							throw errors.CONFLICT({
								data: { version: err.currentVersion ?? 0 },
							});
						}
					}
					throw err;
				}
			},
		),

		close: impl.questions.close.handler(async ({ context, input, errors }) => {
			const userId = context.session?.user.id;
			if (!userId) {
				throw errors.UNAUTHORIZED();
			}

			try {
				return await createQuestionService(context.db).closeQuestion(
					{ id: userId, isAdmin: requireAdmin(context.session).ok },
					input.id,
					input.expectedVersion,
				);
			} catch (err) {
				if (err instanceof QuestionError) {
					if (err.code === "NOT_FOUND") throw errors.NOT_FOUND();
					if (err.code === "FORBIDDEN") throw errors.FORBIDDEN();
					if (err.code === "CONFLICT") {
						throw errors.CONFLICT({
							data: { version: err.currentVersion ?? 0 },
						});
					}
				}
				throw err;
			}
		}),

		delete: impl.questions.delete.handler(
			async ({ context, input, errors }) => {
				const userId = context.session?.user.id;
				if (!userId) {
					throw errors.UNAUTHORIZED();
				}

				try {
					return await createQuestionService(context.db).softDeleteQuestion(
						userId,
						input.id,
						input.expectedVersion,
					);
				} catch (err) {
					if (err instanceof QuestionError) {
						if (err.code === "NOT_FOUND") throw errors.NOT_FOUND();
						if (err.code === "FORBIDDEN") throw errors.FORBIDDEN();
						if (err.code === "CONFLICT") {
							throw errors.CONFLICT({
								data: { version: err.currentVersion ?? 0 },
							});
						}
					}
					throw err;
				}
			},
		),
	};
}
