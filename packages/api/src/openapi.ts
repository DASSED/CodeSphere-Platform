import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import { exposedOverOpenAPI } from "./exposure";
import { appRouter } from "./routers/index";

// Document-level metadata shared by the served spec and any exported copy of it.
const tags = [
	{ name: "health", description: "Liveness and readiness of the API." },
	{
		name: "hackathons",
		description: "Hackathons known to CodeSphere. Public, no authentication.",
	},
	{
		name: "members",
		description:
			"Public member profiles, and the signed-in member's own profile.",
	},
	{
		name: "questions",
		description:
			"Questions asked on the platform. Writes need authentication and the author's rights.",
	},
	{
		name: "admin",
		description:
			"Staff operations (super_admin, admin or moderator): audit log, hackathon edits, question moderation. Each needs a staff session or API key.",
	},
];

// Requests authenticate with a browser session cookie, an `x-api-key` header, or a bearer token.
const securitySchemes = {
	apiKeyHeader: {
		type: "apiKey" as const,
		in: "header" as const,
		name: "x-api-key",
		description: "Agent API key.",
	},
	bearerAuth: {
		type: "http" as const,
		scheme: "bearer",
		description: "Agent API key sent as a bearer token (MCP clients).",
	},
};

/** The REST document: the public surface and the staff operations, each with its own route. */
export function openApiDocument() {
	return new OpenAPIGenerator({
		converters: [new ZodToJsonSchemaConverter()],
	}).generate(appRouter, {
		filter: exposedOverOpenAPI,
		base: {
			info: {
				title: "CodeSphere API",
				version: "1.0.0",
				description:
					"REST surface of CodeSphere. Operations that need authentication accept a session cookie, an `x-api-key` header, or a bearer token.",
			},
			tags,
			components: { securitySchemes },
		},
	});
}
