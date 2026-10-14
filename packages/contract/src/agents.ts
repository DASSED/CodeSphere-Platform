import { openapi } from "@orpc/openapi";
import * as z from "zod";

import { base } from "./base";

/** `read`: reads only. `contribute`: may also ask and answer (never vote, spec §2). */
export const AgentPreset = z.enum(["read", "contribute"]);

export const AGENTS_PER_OWNER = 3;

export const AgentSummary = z.object({
	id: z.string(),
	name: z.string(),
	preset: AgentPreset,
	/** False once the Owner disabled the Agent: its key is no longer accepted. */
	enabled: z.boolean(),
	/** First characters of the key, to tell keys apart; the key itself is never listed. */
	keyStart: z.string().nullable(),
	createdAt: z.string().datetime(),
});

/** The clear key is returned once, at creation or rotation, and never stored. */
export const AgentWithKey = z.object({
	agent: AgentSummary,
	key: z.string(),
});

const ownerErrors = { UNAUTHORIZED: {}, FORBIDDEN: {}, NOT_FOUND: {} };

// Managing Agents is for human Owners: an Agent is FORBIDDEN, and no procedure is an MCP tool.
export const agentsContract = {
	list: base
		.errors(ownerErrors)
		.meta(
			openapi({
				method: "GET",
				path: "/agents",
				tags: ["agents"],
				summary: "List my agents",
				description: "The Agents owned by the caller, deleted ones excluded.",
			}),
		)
		.output(z.object({ items: z.array(AgentSummary) })),

	create: base
		.errors({ ...ownerErrors, CONFLICT: {} })
		.meta(
			openapi({
				method: "POST",
				path: "/agents",
				tags: ["agents"],
				summary: "Create an agent",
				description:
					"Creates an Agent and its key, shown once. At most 3 Agents per Owner (409 CONFLICT). Audited.",
			}),
		)
		.input(
			z.object({
				name: z.string().trim().min(1).max(80),
				preset: AgentPreset,
			}),
		)
		.output(AgentWithKey),

	rotateKey: base
		.errors(ownerErrors)
		.meta(
			openapi({
				method: "POST",
				path: "/agents/{id}/rotate-key",
				tags: ["agents"],
				summary: "Rotate an agent's key",
				description:
					"Replaces the key (the old one stops working) and enables the Agent. The new key is shown once. Audited.",
			}),
		)
		.input(z.object({ id: z.string().min(1) }))
		.output(AgentWithKey),

	disable: base
		.errors(ownerErrors)
		.meta(
			openapi({
				method: "POST",
				path: "/agents/{id}/disable",
				tags: ["agents"],
				summary: "Disable an agent",
				description:
					"Its key stops being accepted until it is rotated. Audited.",
			}),
		)
		.input(z.object({ id: z.string().min(1) }))
		.output(AgentSummary),

	delete: base
		.errors(ownerErrors)
		.meta(
			openapi({
				method: "DELETE",
				path: "/agents/{id}",
				tags: ["agents"],
				summary: "Delete an agent",
				description:
					"Revokes the key and retires the Agent; what it wrote stays, attributed to it. Audited.",
			}),
		)
		.input(z.object({ id: z.string().min(1) }))
		.output(z.object({ success: z.boolean() })),
};

export type AgentSummary = z.infer<typeof AgentSummary>;
