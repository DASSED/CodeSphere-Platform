import { appRouter } from "@codesphere/api/routers/index";
import { type LoggerEnv, requestLogger } from "@codesphere/logger";
import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { MCPHandler } from "orpc-mcp/fetch";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { auth, logger } from "./services";
import { startTelemetry } from "./telemetry";

const stopTelemetry = startTelemetry();
if (stopTelemetry) {
	// A SIGTERM listener replaces the default exit, so flush traces then exit explicitly.
	process.once(
		"SIGTERM",
		() => void stopTelemetry().finally(() => process.exit(0)),
	);
}

const app = new Hono<LoggerEnv>();

app.use(requestLogger(logger, { trustProxy: ENV.TRUST_PROXY }));
app.use(
	"/*",
	cors({
		origin: ENV.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

const openapiGenerator = new OpenAPIGenerator({
	converters: [new ZodToJsonSchemaConverter()],
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferenceHandlerPlugin({
			spec: () =>
				openapiGenerator.generate(appRouter, {
					base: { info: { title: "CodeSphere API", version: "1.0.0" } },
				}),
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter);

const mcpHandler = new MCPHandler(appRouter, {
	serverInfo: { name: "codesphere", version: "0.1.0" },
	converters: [new ZodToJsonSchemaConverter()],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

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

export default app;
