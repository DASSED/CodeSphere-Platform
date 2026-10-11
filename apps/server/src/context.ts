import type { Context as ApiContext } from "@codesphere/api/context";
import type { LoggerEnv } from "@codesphere/logger";
import type { Context as HonoContext } from "hono";
import { ENV } from "./env.server";
import { auth, db } from "./services";

export type CreateContextOptions = {
	context: HonoContext<LoggerEnv>;
};

export async function createContext({
	context,
}: CreateContextOptions): Promise<ApiContext> {
	// An invalid or revoked API key makes better-auth throw; treat it as "not authenticated"
	// so procedures answer UNAUTHORIZED instead of a 500.
	const session = await auth.api
		.getSession({ headers: context.req.raw.headers })
		.catch(() => null);
	return {
		db,
		session,
		logger: context.get("logger"),
		requestId: context.get("requestId"),
		release: { version: ENV.APP_VERSION, commit: ENV.GIT_SHA },
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
