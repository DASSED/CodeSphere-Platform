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
	createdAt: Timestamp,
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
			.input(PageInput)
			.output(Page(AuditEvent)),
	},
};
