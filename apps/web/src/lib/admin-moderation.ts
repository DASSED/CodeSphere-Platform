import type { AdminMember as AdminMemberSchema, AuditEvent as AuditEventSchema } from "@codesphere/contract";
import type { z } from "zod";
import { outranks } from "@codesphere/contract";
import type { AuditEntry } from "@codesphere/ui/components/organisms/audit-log";

import { errorCodeOf } from "@/i18n/errors";

type AdminMember = z.infer<typeof AdminMemberSchema>;
type AuditEvent = z.infer<typeof AuditEventSchema>;

export type MemberGroup = "suspended" | "agents" | "active";

/** The group of the moderation list (#117): suspended first, then agents, then active humans. */
export function memberGroup(member: AdminMember): MemberGroup {
	if (member.suspendedAt) {
		return "suspended";
	}
	return member.kind === "agent" ? "agents" : "active";
}

/** Whether the signed-in staff may suspend `member`; the refusal says why, before any action. */
export function canModerate(
	member: AdminMember,
	selfId: string | undefined,
	actorRole?: string,
): { ok: true } | { ok: false; reason: "self" | "rank" } {
	if (member.id === selfId) {
		return { ok: false, reason: "self" };
	}
	if (actorRole !== undefined && !outranks(actorRole, member.role)) {
		return { ok: false, reason: "rank" };
	}
	return { ok: true };
}

/** Key under `admin.errors` for a failed moderation call. */
export function moderationErrorKey(
	error: unknown,
): "forbidden" | "conflict" | "notFound" | "generic" {
	switch (errorCodeOf(error)) {
		case "FORBIDDEN":
			return "forbidden";
		case "CONFLICT":
			return "conflict";
		case "NOT_FOUND":
			return "notFound";
		default:
			return "generic";
	}
}

const DESTRUCTIVE = /\.(suspend|remove|delete)$/;
const WARNING = /\.(update|rename|reactivate)$/;

/** An audit event as a row of `AuditLog`; `nameOf` resolves an id to a display name when known. */
export function auditEntryOf(
	event: AuditEvent,
	nameOf: (id: string) => string | undefined,
	formatDate: (iso: string) => string = (iso) => iso,
): AuditEntry {
	const target = event.targetId
		? (nameOf(event.targetId) ?? `${event.targetType} ${event.targetId}`)
		: event.targetType;
	return {
		id: event.id,
		at: formatDate(event.createdAt),
		actor: event.actorId ? (nameOf(event.actorId) ?? event.actorId) : "Système",
		action: event.action,
		target,
		tone: DESTRUCTIVE.test(event.action)
			? "destructive"
			: WARNING.test(event.action)
				? "warning"
				: "default",
		reason: event.details?.reason,
	};
}
