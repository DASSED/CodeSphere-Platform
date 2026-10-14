"use client";

import type { Vote } from "@codesphere/ui/components/molecules/vote-control";

import { useOutbox } from "@/components/outbox-provider";

/** The Score a vote change leaves, before the server confirms it. */
export function scoreAfter(score: number, from: Vote | null, to: Vote | null) {
	const weight = (v: Vote | null) => (v === "up" ? 1 : v === "down" ? -1 : 0);
	return score - weight(from) + weight(to);
}

/**
 * Casting or retracting a vote goes through the outbox (#74): `onOptimistic` shows the new vote at
 * once, and the server's Score replaces it once the vote is sent.
 */
export function useVote(
	targetType: "question" | "answer",
	targetId: string,
	onOptimistic: (vote: Vote | null) => void,
) {
	const { enqueue } = useOutbox();
	return (vote: Vote | null) => {
		onOptimistic(vote);
		void enqueue(
			vote
				? {
						kind: "vote.cast",
						input: { targetType, targetId, value: vote },
					}
				: { kind: "vote.retract", input: { targetType, targetId } },
		);
	};
}
