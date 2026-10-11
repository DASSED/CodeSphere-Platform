import { ORPCError } from "@orpc/server";

import { impl } from "./index";

// An unexpected failure is logged with the request's logger and answered as the contract's
// INTERNAL_SERVER_ERROR (spec §3): no detail, only the request id to quote to support.
// Errors the procedures throw on purpose (typed codes) pass through unchanged.
export const unexpectedErrors = impl.middleware(async ({ context, next }) => {
	try {
		return await next();
	} catch (error) {
		if (error instanceof ORPCError) {
			throw error;
		}
		context.logger.error({ err: error }, "procedure failed");
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			data: { requestId: context.requestId },
		});
	}
});
