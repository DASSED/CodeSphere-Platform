import type { AnyProcedureContract } from "@orpc/contract";

// Which procedures leave the web app (#122). Admin mutations are reached over /rpc only: never
// through the public REST surface nor as an MCP tool, so an Agent can never even see them.

type Meta = {
	"~openapi"?: { method?: string };
	"~mcp"?: { type?: string; annotations?: { readOnlyHint?: boolean } };
};

const metaOf = (procedure: { "~orpc": unknown }) =>
	((procedure["~orpc"] as { meta?: Meta }).meta ?? {}) as Meta;

/** OpenAPI `filter` for the handler and the generator: an admin procedure must be an explicit GET. */
export function exposedOverOpenAPI(
	procedure: Pick<AnyProcedureContract, "~orpc">,
	path: readonly string[],
): boolean {
	return path[0] !== "admin" || metaOf(procedure)["~openapi"]?.method === "GET";
}

/** Every procedure tagged as an MCP tool, with whether it declares itself read-only. */
export function mcpTools(
	router: object,
	path: string[] = [],
): { path: string[]; readOnly: boolean }[] {
	if ("~orpc" in router) {
		const tool = metaOf(router as { "~orpc": unknown })["~mcp"];
		return tool?.type === "tool"
			? [{ path, readOnly: tool.annotations?.readOnlyHint === true }]
			: [];
	}
	return Object.entries(router).flatMap(([key, child]) =>
		child && typeof child === "object" ? mcpTools(child, [...path, key]) : [],
	);
}
