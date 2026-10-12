import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import { base, Page, PageInput, Timestamp } from "./base";

export const AuditEvent = z.object({
	id: z.string(),
	actorId: z.string().nullable(),
	action: z.string(),
	targetType: z.string(),
	targetId: z.string().nullable(),
	/** Names of the fields that changed and, for a suspension, the reason: never personal values. */
	details: z
		.object({
			fields: z.array(z.string()).optional(),
			reason: z.string().max(500).optional(),
		})
		.nullable(),
	createdAt: Timestamp,
});

export const AuditLogFilter = PageInput.extend({
	/** Exact action, e.g. "hackathon.update". */
	action: z.string().min(1).max(64).optional(),
	actorId: z.string().min(1).optional(),
	targetType: z.string().min(1).max(64).optional(),
});

export const adminContract = {
	auditLog: {
		list: base
			.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} })
			.meta(
				openapi({ method: "GET", path: "/admin/audit-log", tags: ["admin"] }),
			)
			.meta(
				mcp.tool({
					description:
						"List the admin audit log, newest first. Requires the admin role.",
					annotations: { readOnlyHint: true },
				}),
			)
			.input(AuditLogFilter)
			.output(Page(AuditEvent)),
	},
};
