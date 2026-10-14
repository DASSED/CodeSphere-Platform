import { AGENTS_PER_OWNER, type AgentSummary } from "@codesphere/contract";
import type { Database } from "@codesphere/db";
import { apikey, user } from "@codesphere/db/schema/auth";
import { and, count, eq, isNull, ne, or, sql } from "drizzle-orm";

import { withAudit } from "../audit";

export class AgentError extends Error {
	constructor(readonly code: "NOT_FOUND" | "CONFLICT") {
		super(code);
	}
}

const KEY_PREFIX = "cs_live_";
const DELETED = "deleted";
const ALPHABET =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// 40 random base62 characters (~238 bits) behind the `cs_live_` prefix.
function generateKey() {
	const bytes = crypto.getRandomValues(new Uint8Array(40));
	let out = KEY_PREFIX;
	for (const byte of bytes) {
		out += ALPHABET[byte % ALPHABET.length];
	}
	return out;
}

// The hash better-auth's api-key plugin looks keys up by: SHA-256, base64url without padding.
async function hashKey(key: string) {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(key),
	);
	return Buffer.from(digest).toString("base64url");
}

type Preset = "read" | "contribute";

const presetOf = (metadata: string | null): Preset => {
	try {
		return JSON.parse(metadata ?? "{}").preset === "contribute"
			? "contribute"
			: "read";
	} catch {
		return "read";
	}
};

/** The preset of an Agent's key: the scope the API middleware enforces on its writes. */
export async function agentPreset(
	db: Database,
	agentId: string,
): Promise<Preset | null> {
	const [row] = await db
		.select({ metadata: apikey.metadata, enabled: apikey.enabled })
		.from(apikey)
		.where(eq(apikey.referenceId, agentId))
		.limit(1);
	return row ? presetOf(row.metadata) : null;
}

export function createAgentService(db: Database) {
	const owned = (ownerId: string, id: string) =>
		and(
			eq(user.id, id),
			eq(user.ownerId, ownerId),
			eq(user.kind, "agent"),
			or(isNull(user.suspensionReason), ne(user.suspensionReason, DELETED)),
		);

	async function summary(ownerId: string, id: string): Promise<AgentSummary> {
		const [row] = await db
			.select({
				id: user.id,
				name: user.name,
				createdAt: user.createdAt,
				metadata: apikey.metadata,
				enabled: apikey.enabled,
				start: apikey.start,
			})
			.from(user)
			.leftJoin(apikey, eq(apikey.referenceId, user.id))
			.where(owned(ownerId, id))
			.limit(1);
		if (!row) {
			throw new AgentError("NOT_FOUND");
		}
		return {
			id: row.id,
			name: row.name,
			preset: presetOf(row.metadata),
			enabled: row.enabled ?? false,
			keyStart: row.start,
			createdAt: row.createdAt.toISOString(),
		};
	}

	// The apikey row for the agent `m` produced: the hash is stored, the clear key never.
	const apikeyInsert = (
		key: string,
		hash: string,
		name: string,
		preset: Preset,
	) => sql`
		INSERT INTO apikey (id, config_id, name, start, reference_id, prefix, key, enabled,
			rate_limit_enabled, rate_limit_time_window, rate_limit_max, request_count,
			created_at, updated_at, metadata)
		SELECT ${crypto.randomUUID()}, 'default', ${name}, ${key.slice(0, 12)}, m.id, ${KEY_PREFIX},
			${hash}, true, true, 60000, 120, 0, now(), now(), ${JSON.stringify({ preset })}
		FROM m
	`;

	return {
		async list(ownerId: string) {
			const rows = await db
				.select({ id: user.id })
				.from(user)
				.where(
					and(
						eq(user.ownerId, ownerId),
						eq(user.kind, "agent"),
						or(
							isNull(user.suspensionReason),
							ne(user.suspensionReason, DELETED),
						),
					),
				)
				.orderBy(user.createdAt);
			return {
				items: await Promise.all(rows.map((r) => summary(ownerId, r.id))),
			};
		},

		/** Up to AGENTS_PER_OWNER live Agents per Owner; the key is returned once. Audited. */
		async create(ownerId: string, input: { name: string; preset: Preset }) {
			const [{ n } = { n: 0 }] = await db
				.select({ n: count() })
				.from(user)
				.where(
					and(
						eq(user.ownerId, ownerId),
						eq(user.kind, "agent"),
						or(
							isNull(user.suspensionReason),
							ne(user.suspensionReason, DELETED),
						),
					),
				);
			if (n >= AGENTS_PER_OWNER) {
				throw new AgentError("CONFLICT");
			}
			const id = crypto.randomUUID();
			const key = generateKey();
			const hash = await hashKey(key);
			// The Agent and its key land in one statement, with their audit event (#122).
			await withAudit(
				db,
				{
					actorId: ownerId,
					action: "agent.key.create",
					targetType: "agent",
					targetIdColumn: "id",
					details: { fields: ["preset"] },
				},
				db
					.insert(user)
					.values({
						id,
						name: input.name,
						email: `agent-${id}@agents.invalid`,
						emailVerified: true,
						kind: "agent",
						ownerId,
					})
					.returning({ id: user.id }),
				[apikeyInsert(key, hash, input.name, input.preset)],
			);
			return { agent: await summary(ownerId, id), key };
		},

		/** New key, old one dead, Agent enabled again. Two events: the revoked key and the new one. */
		async rotateKey(ownerId: string, id: string) {
			await summary(ownerId, id);
			const key = generateKey();
			const hash = await hashKey(key);
			const rows = await withAudit(
				db,
				[
					{
						actorId: ownerId,
						action: "agent.key.revoke",
						targetType: "agent",
						targetIdColumn: "reference_id",
						details: { reason: "rotated" },
					},
					{
						actorId: ownerId,
						action: "agent.key.create",
						targetType: "agent",
						targetIdColumn: "reference_id",
						details: { reason: "rotated" },
					},
				],
				db
					.update(apikey)
					.set({
						key: hash,
						start: key.slice(0, 12),
						enabled: true,
						updatedAt: new Date(),
					})
					.where(eq(apikey.referenceId, id))
					.returning({ reference_id: apikey.referenceId }),
			);
			if (rows.length === 0) {
				throw new AgentError("NOT_FOUND");
			}
			return { agent: await summary(ownerId, id), key };
		},

		async disable(ownerId: string, id: string) {
			await summary(ownerId, id);
			const rows = await withAudit(
				db,
				{
					actorId: ownerId,
					action: "agent.key.revoke",
					targetType: "agent",
					targetIdColumn: "reference_id",
					details: { reason: "disabled" },
				},
				db
					.update(apikey)
					.set({ enabled: false, updatedAt: new Date() })
					.where(eq(apikey.referenceId, id))
					.returning({ reference_id: apikey.referenceId }),
			);
			if (rows.length === 0) {
				throw new AgentError("NOT_FOUND");
			}
			return summary(ownerId, id);
		},

		/**
		 * The user row stays (its Questions and Answers point at it): the key is deleted and the
		 * Agent is marked retired, which hides it from the Owner's list and counts it out of the cap.
		 */
		async remove(ownerId: string, id: string) {
			const rows = await withAudit(
				db,
				{
					actorId: ownerId,
					action: "agent.key.revoke",
					targetType: "agent",
					targetIdColumn: "id",
					details: { reason: "deleted" },
				},
				db
					.update(user)
					.set({
						suspendedAt: new Date(),
						suspensionReason: DELETED,
						updatedAt: new Date(),
					})
					.where(owned(ownerId, id))
					.returning({ id: user.id }),
				[sql`DELETE FROM apikey WHERE reference_id IN (SELECT id FROM m)`],
			);
			if (rows.length === 0) {
				throw new AgentError("NOT_FOUND");
			}
			return { success: true };
		},
	};
}
