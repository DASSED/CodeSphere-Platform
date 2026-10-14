// What the web app keeps on the device (spec §3, #73 #74): the outbox and the Drafts, filed under
// the Member they belong to, next to the persisted Query cache. Never a key or a session.
// Signing out, or another Member signing in on the same browser, wipes all of it.

import { clear, del, get, set } from "idb-keyval";

import type { OutboxEntry } from "./outbox";

/** The Member whose data the device currently holds. */
const OWNER_KEY = "codesphere:member";

const outboxKey = (memberId: string) => `codesphere:${memberId}:outbox`;
const draftKey = (memberId: string, key: string) =>
	`codesphere:${memberId}:draft:${key}`;

const available = () => typeof window !== "undefined" && "indexedDB" in window;

export async function loadOutbox(memberId: string): Promise<OutboxEntry[]> {
	if (!available()) {
		return [];
	}
	return (await get<OutboxEntry[]>(outboxKey(memberId))) ?? [];
}

export async function saveOutbox(memberId: string, entries: OutboxEntry[]) {
	if (!available()) {
		return;
	}
	await set(outboxKey(memberId), entries);
}

export async function loadDraft<T>(memberId: string, key: string) {
	return available() ? get<T>(draftKey(memberId, key)) : undefined;
}

export async function saveDraft<T>(memberId: string, key: string, value: T) {
	if (available()) {
		await set(draftKey(memberId, key), value);
	}
}

export async function deleteDraft(memberId: string, key: string) {
	if (available()) {
		await del(draftKey(memberId, key));
	}
}

/** Drops the Draft a sent write came from, unless the Member has started a new one since. */
export async function deleteSentDraft(
	memberId: string,
	key: string,
	idempotencyKey: string,
) {
	const draft = await loadDraft<{ idempotencyKey?: string }>(memberId, key);
	if (draft?.idempotencyKey === idempotencyKey) {
		await deleteDraft(memberId, key);
	}
}

/** Empties the app's IndexedDB: outbox, Drafts and the persisted Query cache. */
export async function clearLocalData() {
	if (available()) {
		await clear();
	}
}

/**
 * Called once the session is known: if the device holds another Member's data (an account switch
 * without a sign-out), it is wiped before anything of the new Member is read or written.
 * Returns true when data was wiped.
 */
export async function claimDevice(memberId: string): Promise<boolean> {
	if (!available()) {
		return false;
	}
	const owner = await get<string>(OWNER_KEY);
	if (owner === memberId) {
		return false;
	}
	const wiped = owner !== undefined;
	if (wiped) {
		await clear();
	}
	await set(OWNER_KEY, memberId);
	return wiped;
}

/** Asks the browser not to evict the offline data under storage pressure. Best effort. */
export async function requestPersistentStorage() {
	try {
		await navigator.storage?.persist?.();
	} catch {
		// Not granted, or not supported: the cache still works, it may just be evicted.
	}
}
