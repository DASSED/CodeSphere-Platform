import { appRouter } from "@codesphere/api/routers/index";
import type { createAuth } from "@codesphere/auth";
import type { Database } from "@codesphere/db";
import { type Logger, type LoggerEnv, requestLogger } from "@codesphere/logger";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { MCPHandler } from "orpc-mcp/fetch";

import { createContext } from "./context";

export type AppDeps = {
	auth: ReturnType<typeof createAuth>;
	db: Database;
	logger: Logger;
	corsOrigin: string;
	trustProxy: boolean;
	release: { version: string; commit: string };
};

// Stateless handlers: built once per isolate or process, shared by every request.
const openapiGenerator = new OpenAPIGenerator({
	converters: [new ZodToJsonSchemaConverter()],
});

let openapiSpec: ReturnType<typeof openapiGenerator.generate> | undefined;

const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferenceHandlerPlugin({
			// The spec only depends on the router: generate it once, not per request.
			spec: () => {
				openapiSpec ??= openapiGenerator.generate(appRouter, {
					base: { info: { title: "CodeSphere API", version: "1.0.0" } },
				});
				return openapiSpec;
			},
		}),
	],
});

const rpcHandler = new RPCHandler(appRouter);

const mcpHandler = new MCPHandler(appRouter, {
	serverInfo: { name: "codesphere", version: "0.1.0" },
	converters: [new ZodToJsonSchemaConverter()],
});

/**
 * The HTTP application, free of any runtime: the Bun entry (`index.ts`) and the Cloudflare
 * Worker entry (`worker.ts`) build their services their own way and hand them over.
 */
export function createApp(deps: AppDeps) {
	const app = new Hono<LoggerEnv>();

	app.use(requestLogger(deps.logger, { trustProxy: deps.trustProxy }));
	app.use(
		"/*",
		cors({
			origin: deps.corsOrigin,
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	);

	app.on(["POST", "GET"], "/api/auth/*", async (c) =>
		deps.auth.handler(c.req.raw),
	);

	app.use("/*", async (c, next) => {
		const context = await createContext({ context: c, deps });

		const rpcResult = await rpcHandler.handle(c.req.raw, {
			prefix: "/rpc",
			context: context,
		});

		if (rpcResult.matched) {
			return c.newResponse(rpcResult.response.body, rpcResult.response);
		}

		const apiResult = await apiHandler.handle(c.req.raw, {
			prefix: "/api/v1",
			context: context,
		});

		if (apiResult.matched) {
			return c.newResponse(apiResult.response.body, apiResult.response);
		}

		const mcpResult = await mcpHandler.handle(c.req.raw, {
			prefix: "/mcp",
			context: context,
		});

		if (mcpResult.matched) {
			return c.newResponse(mcpResult.response.body, mcpResult.response);
		}

		await next();
	});

	app.get("/", (c) => {
		return c.text("OK");
	});

	return app;
}
