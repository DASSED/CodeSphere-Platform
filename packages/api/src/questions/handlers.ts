import { impl } from "../index";
import type { createQuestionService } from "./service";

export function createQuestionsHandlers(
	service: ReturnType<typeof createQuestionService>,
) {
	return {
		create: impl.questions.create.handler(
			async ({ context, input, errors }) => {
				const userId = context.session?.user.id;
				if (!userId) {
					throw errors.UNAUTHORIZED();
				}

				try {
					return await service.createQuestion(userId, input);
				} catch (err) {
					const msg = (err as Error).message;
					if (msg.includes("VALIDATION_ERROR")) {
						throw errors.BAD_REQUEST({
							data: {
								issues: [
									{
										path: ["tags"],
										message: msg.replace("VALIDATION_ERROR: ", ""),
									},
								],
							},
						});
					}
					throw err;
				}
			},
		),

		get: impl.questions.get.handler(async ({ input, errors }) => {
			try {
				return await service.getQuestion(input.id);
			} catch (err) {
				if ((err as Error).message === "NOT_FOUND") {
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
					return await service.updateQuestion(userId, input);
				} catch (err) {
					const msg = (err as Error).message;
					if (msg === "NOT_FOUND") throw errors.NOT_FOUND();
					if (msg === "UNAUTHORIZED") throw errors.UNAUTHORIZED();
					if (msg.startsWith("CONFLICT")) {
						const version = Number.parseInt(msg.match(/\d+/)?.[0] ?? "0");
						throw errors.CONFLICT({ data: { version } });
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
				return await service.closeQuestion(
					userId,
					input.id,
					input.expectedVersion,
				);
			} catch (err) {
				const msg = (err as Error).message;
				if (msg === "NOT_FOUND") throw errors.NOT_FOUND();
				if (msg.startsWith("CONFLICT")) {
					const version = Number.parseInt(msg.match(/\d+/)?.[0] ?? "0");
					throw errors.CONFLICT({ data: { version } });
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
					return await service.softDeleteQuestion(
						userId,
						input.id,
						input.expectedVersion,
					);
				} catch (err) {
					const msg = (err as Error).message;
					if (msg === "NOT_FOUND") throw errors.NOT_FOUND();
					if (msg === "UNAUTHORIZED") throw errors.UNAUTHORIZED();
					if (msg.startsWith("CONFLICT")) {
						const version = Number.parseInt(msg.match(/\d+/)?.[0] ?? "0");
						throw errors.CONFLICT({ data: { version } });
					}
					throw err;
				}
			},
		),
	};
}
