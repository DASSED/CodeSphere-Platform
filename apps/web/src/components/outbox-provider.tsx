"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { authClient } from "@/lib/auth-client";
import {
	claimDevice,
	deleteSentDraft,
	loadOutbox,
	saveOutbox,
} from "@/lib/local-store";
import {
	flush,
	newEntry,
	type OutboxAction,
	type OutboxEntry,
	waiting,
} from "@/lib/outbox";
import { clearPersistedCache } from "@/lib/persist";
import { client, orpc } from "@/utils/orpc";

/** How often due entries are retried while the page is open. */
const TICK = 15_000;

type Outbox = {
	/** False once the browser reports it lost the network. */
	online: boolean;
	entries: OutboxEntry[];
	/** Entries still waiting to be sent. */
	pendingCount: number;
	/** Queues a write and tries it at once when online; returns the entry's id. */
	enqueue: (action: OutboxAction) => Promise<string>;
	/** Removes a rejected, abandoned or sent entry the Member has seen. */
	dismiss: (id: string) => void;
};

const OutboxContext = createContext<Outbox | null>(null);

/** The oRPC call behind each action. Creations carry their idempotencyKey: a replay is safe. */
function send(action: OutboxAction): Promise<unknown> {
	switch (action.kind) {
		case "question.create":
			return client.questions.create(action.input);
		case "answer.create":
			return client.answers.create(action.input);
		case "vote.cast":
			return client.votes.cast(action.input);
		case "vote.retract":
			return client.votes.retract(action.input);
		case "tag.follow":
			return client.tags.follow(action.input);
		case "answer.accept":
			return client.answers.accept(action.input);
	}
}

function useOnlineStatus() {
	const [online, setOnline] = useState(true);
	useEffect(() => {
		setOnline(navigator.onLine);
		const update = () => setOnline(navigator.onLine);
		window.addEventListener("online", update);
		window.addEventListener("offline", update);
		return () => {
			window.removeEventListener("online", update);
			window.removeEventListener("offline", update);
		};
	}, []);
	return online;
}

/**
 * The outbox of the signed-in Member (#74), stored on the device under their id and sent when the
 * network allows: at once, when the browser comes back online, and every 15 seconds. Also guards
 * the device (#73): another Member's local data is wiped before this one's is read.
 */
export function OutboxProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const memberId = session?.user.id ?? null;
	const online = useOnlineStatus();
	const [entries, setEntries] = useState<OutboxEntry[]>([]);
	const current = useRef<OutboxEntry[]>([]);
	const running = useRef(false);

	const commit = useCallback(
		(next: OutboxEntry[]) => {
			current.current = next;
			setEntries(next);
			if (memberId) {
				void saveOutbox(memberId, next);
			}
		},
		[memberId],
	);

	// A sent write changes what the reads show: refresh them once it is through.
	const refresh = useCallback(
		(entry: OutboxEntry) => {
			const keys =
				entry.action.kind === "tag.follow"
					? [orpc.tags.key(), orpc.feed.key()]
					: [orpc.questions.key(), orpc.answers.key(), orpc.feed.key()];
			for (const queryKey of keys) {
				void queryClient.invalidateQueries({ queryKey });
			}
		},
		[queryClient],
	);

	const run = useCallback(async () => {
		if (running.current || !memberId) {
			return;
		}
		running.current = true;
		try {
			const before = current.current;
			const after = await flush(before, send, {
				now: Date.now,
				online: () => navigator.onLine,
				onChange: (next) => {
					// Merged by id: an entry queued during the pass is kept, a dismissed one stays gone.
					const byId = new Map(next.map((e) => [e.id, e]));
					commit(current.current.map((e) => byId.get(e.id) ?? e));
				},
			});
			after.forEach((entry, i) => {
				if (entry.state !== "sent" || before[i]?.state === "sent") {
					return;
				}
				refresh(entry);
				// Sent while the form was closed: its Draft is done with.
				const { action } = entry;
				if (action.kind === "question.create") {
					void deleteSentDraft(
						memberId,
						"question:new",
						action.input.idempotencyKey,
					);
				} else if (action.kind === "answer.create") {
					void deleteSentDraft(
						memberId,
						`answer:${action.input.questionId}`,
						action.input.idempotencyKey,
					);
				}
			});
		} finally {
			running.current = false;
		}
	}, [commit, memberId, refresh]);

	// Load the Member's outbox, after making sure the device holds no one else's data.
	useEffect(() => {
		current.current = [];
		setEntries([]);
		if (!memberId) {
			return;
		}
		let cancelled = false;
		void (async () => {
			if (await claimDevice(memberId)) {
				queryClient.clear();
			}
			// What was sent in an earlier visit has nothing left to show.
			const stored = (await loadOutbox(memberId)).filter(
				(e) => e.state !== "sent",
			);
			if (!cancelled) {
				current.current = stored;
				setEntries(stored);
				void run();
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [memberId, queryClient, run]);

	useEffect(() => {
		if (online) {
			void run();
		}
		const timer = setInterval(() => void run(), TICK);
		return () => clearInterval(timer);
	}, [online, run]);

	const enqueue = useCallback(
		async (action: OutboxAction) => {
			const entry = newEntry(action, Date.now());
			commit([...current.current, entry]);
			void run();
			return entry.id;
		},
		[commit, run],
	);

	const dismiss = useCallback(
		(id: string) => commit(current.current.filter((e) => e.id !== id)),
		[commit],
	);

	const value = useMemo<Outbox>(
		() => ({
			online,
			entries,
			pendingCount: waiting(entries).length,
			enqueue,
			dismiss,
		}),
		[online, entries, enqueue, dismiss],
	);

	return (
		<OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>
	);
}

export function useOutbox(): Outbox {
	const outbox = useContext(OutboxContext);
	if (!outbox) {
		throw new Error("useOutbox must be used inside <OutboxProvider>");
	}
	return outbox;
}

/** One entry of the outbox, to follow a write from « en attente » to « envoyé » or « rejeté ». */
export function useOutboxEntry(id: string | null): OutboxEntry | undefined {
	const { entries } = useOutbox();
	return id ? entries.find((e) => e.id === id) : undefined;
}

/** Signs out and wipes everything the device kept for the Member (#73). */
export function useSignOut() {
	const queryClient = useQueryClient();
	return async (onDone?: () => void) => {
		await authClient.signOut();
		await clearPersistedCache(queryClient);
		onDone?.();
	};
}
