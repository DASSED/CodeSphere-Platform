import type { Context as ApiContext } from "@codesphere/api/context";
import type { LoggerEnv } from "@codesphere/logger";
import type { Context as HonoContext } from "hono";

import type { AppDeps } from "./app";

export type CreateContextOptions = {
	context: HonoContext<LoggerEnv>;
	deps: Pick<AppDeps, "auth" | "db" | "release">;
};

export async function createContext({
	context,
	deps,
}: CreateContextOptions): Promise<ApiContext> {
	// An invalid or revoked API key makes better-auth throw; treat it as "not authenticated"
	// so procedures answer UNAUTHORIZED instead of a 500.
	const session = await deps.auth.api
		.getSession({ headers: context.req.raw.headers })
		.catch(() => null);
	return {
		db: deps.db,
		session,
		logger: context.get("logger"),
		requestId: context.get("requestId"),
		release: deps.release,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
