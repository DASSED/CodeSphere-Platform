import { impl } from "../index";
import { AgentError, createAgentService } from "./service";

// Managing Agents is for human Owners: a visitor is UNAUTHORIZED and an Agent FORBIDDEN.
export function createAgentsHandlers() {
	const owner = (
		context: { session: { user: { id: string } } | null },
		errors: { UNAUTHORIZED: () => Error; FORBIDDEN: () => Error },
	) => {
		const user = context.session?.user as
			| { id: string; kind?: string }
			| undefined;
		if (!user) {
			throw errors.UNAUTHORIZED();
		}
		if (user.kind !== "human") {
			throw errors.FORBIDDEN();
		}
		return user.id;
	};
	const refusal = (
		err: unknown,
		errors: { NOT_FOUND: () => Error; CONFLICT?: () => Error },
	) => {
		if (err instanceof AgentError) {
			if (err.code === "CONFLICT" && errors.CONFLICT) return errors.CONFLICT();
			return errors.NOT_FOUND();
		}
		return err;
	};

	return {
		list: impl.agents.list.handler(async ({ context, errors }) =>
			createAgentService(context.db).list(owner(context, errors)),
		),
		create: impl.agents.create.handler(async ({ context, input, errors }) => {
			const ownerId = owner(context, errors);
			try {
				return await createAgentService(context.db).create(ownerId, input);
			} catch (err) {
				throw refusal(err, errors);
			}
		}),
		rotateKey: impl.agents.rotateKey.handler(
			async ({ context, input, errors }) => {
				const ownerId = owner(context, errors);
				try {
					return await createAgentService(context.db).rotateKey(
						ownerId,
						input.id,
					);
				} catch (err) {
					throw refusal(err, errors);
				}
			},
		),
		disable: impl.agents.disable.handler(async ({ context, input, errors }) => {
			const ownerId = owner(context, errors);
			try {
				return await createAgentService(context.db).disable(ownerId, input.id);
			} catch (err) {
				throw refusal(err, errors);
			}
		}),
		delete: impl.agents.delete.handler(async ({ context, input, errors }) => {
			const ownerId = owner(context, errors);
			try {
				return await createAgentService(context.db).remove(ownerId, input.id);
			} catch (err) {
				throw refusal(err, errors);
			}
		}),
	};
}
