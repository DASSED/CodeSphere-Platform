import { openapi } from "@orpc/openapi";
import { mcp } from "orpc-mcp";
import * as z from "zod";

import {
	base,
	ExpectedVersion,
	Id,
	Page,
	PageInput,
	Timestamp,
} from "./base";
import { Hackathon } from "./hackathons";

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

/** Scalar fields of a Hackathon an admin may edit. Milestones, prizes and criteria are not among them. */
export const HackathonUpdate = z.object({
	slug: z.string(),
	expectedVersion: ExpectedVersion,
	name: z.string().trim().min(1).max(200).optional(),
	organizer: z.string().trim().min(1).max(200).optional(),
	summary: z.string().trim().min(1).max(2000).optional(),
	teamMin: z.number().int().min(1).max(50).optional(),
	teamMax: z.number().int().min(1).max(50).optional(),
	sourceUrl: z.url().optional(),
	sourceNote: z.string().max(500).nullable().optional(),
	verifiedAt: Timestamp.optional(),
});

/** Staff writes. Every one needs a staff role (super_admin, admin or moderator), see requireAdmin. */
const staffErrors = {
	UNAUTHORIZED: {},
	FORBIDDEN: {},
	NOT_FOUND: {},
	CONFLICT: { data: z.object({ version: z.number() }) },
};

export const adminContract = {
	auditLog: {
		list: base
			.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} })
			.meta(
				openapi({
					method: "GET",
					path: "/admin/audit-log",
					tags: ["admin"],
					summary: "List the audit log",
					description:
						"Admin audit log, newest first, filterable by action, actor and target type. Requires a staff role: UNAUTHORIZED without a session, FORBIDDEN without one.",
				}),
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
	hackathons: {
		update: base
			.errors(staffErrors)
			.meta(
				openapi({
					method: "PATCH",
					path: "/admin/hackathons/{slug}",
					tags: ["admin"],
					summary: "Update a hackathon",
					description:
						"Edits the scalar fields of a hackathon (not its milestones, prizes or criteria). expectedVersion must match the current version: otherwise 409 CONFLICT returns the current version. Requires a staff role. Audited.",
				}),
			)
			.input(HackathonUpdate)
			.output(Hackathon),
	},
	questions: {
		remove: base
			.errors(staffErrors)
			.meta(
				openapi({
					method: "DELETE",
					path: "/admin/questions/{id}",
					tags: ["admin"],
					summary: "Remove a question (moderation)",
					description:
						"Soft-deletes any question, whoever wrote it. expectedVersion must match the current version (409 CONFLICT otherwise). Requires a staff role. Audited.",
				}),
			)
			.input(z.object({ id: Id, expectedVersion: ExpectedVersion }))
			.output(z.object({ success: z.boolean() })),
	},
};
