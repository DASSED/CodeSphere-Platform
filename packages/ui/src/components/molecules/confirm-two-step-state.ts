// The two-step confirmation of a destructive admin action (#131), kept pure so it is tested
// without a DOM: idle → armed (countdown) → confirmed, or back to idle on cancel or at 0.

export type ConfirmState =
	| { phase: "idle" }
	| { phase: "armed"; remaining: number }
	| { phase: "confirmed" };

export type ConfirmEvent =
	| { type: "arm"; seconds: number }
	| { type: "tick" }
	| { type: "cancel" }
	| { type: "confirm" }
	/** A key pressed on one of the two armed buttons. */
	| { type: "key"; key: string; on: "confirm" | "cancel" };

export const IDLE: ConfirmState = { phase: "idle" };

export function confirmStep(
	state: ConfirmState,
	event: ConfirmEvent,
): ConfirmState {
	switch (event.type) {
		case "arm":
			return state.phase === "idle"
				? { phase: "armed", remaining: event.seconds }
				: state;
		case "tick":
			if (state.phase !== "armed") {
				return state;
			}
			// Nothing happens by itself: at 0 the action is cancelled, never confirmed.
			return state.remaining <= 1
				? IDLE
				: { phase: "armed", remaining: state.remaining - 1 };
		case "cancel":
			return state.phase === "armed" ? IDLE : state;
		case "confirm":
			return state.phase === "armed" ? { phase: "confirmed" } : state;
		case "key":
			if (state.phase !== "armed") {
				return state;
			}
			if (event.key === "Escape") {
				return IDLE;
			}
			if (event.key === "Enter" || event.key === " ") {
				return event.on === "confirm" ? { phase: "confirmed" } : IDLE;
			}
			return state;
	}
}
