"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import {
	type ConfirmEvent,
	type ConfirmState,
	confirmStep,
	IDLE,
} from "@codesphere/ui/components/molecules/confirm-two-step-state";
import { cn } from "@codesphere/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type ConfirmTwoStepProps = {
	/** The action, e.g. « Suspendre ce Member ». Shown as « Suspendre ce Member… » before arming. */
	label: string;
	/** Armed button text, given the seconds left: `(s) => \`Confirmer (${s} s)\``. */
	confirmLabel?: (seconds: number) => string;
	cancelLabel?: string;
	onConfirm: () => void;
	/** Greys the control out; pair it with the reason, shown before any action. */
	disabled?: boolean;
	/** Seconds before an armed confirmation cancels itself. */
	seconds?: number;
	className?: string;
};

/**
 * A destructive action in two steps (#117, #131): the first press arms it, a second press on
 * « Confirmer (5 s) » runs it; « Annuler », Escape or the end of the countdown disarm it.
 * Fully keyboard-driven: arming moves the focus to « Confirmer », disarming brings it back.
 */
function ConfirmTwoStep({
	label,
	confirmLabel = (seconds) => `Confirmer (${seconds} s)`,
	cancelLabel = "Annuler",
	onConfirm,
	disabled,
	seconds = 5,
	className,
}: ConfirmTwoStepProps) {
	const [state, setState] = useState<ConfirmState>(IDLE);
	const current = useRef(state);
	const armButton = useRef<HTMLButtonElement>(null);
	const confirmButton = useRef<HTMLButtonElement>(null);

	const send = useCallback(
		(event: ConfirmEvent) => {
			let next = confirmStep(current.current, event);
			if (next.phase === "confirmed") {
				next = IDLE;
				onConfirm();
			}
			current.current = next;
			setState(next);
		},
		[onConfirm],
	);

	const armed = state.phase === "armed";
	useEffect(() => {
		if (!armed) {
			return;
		}
		confirmButton.current?.focus();
		const timer = setInterval(() => send({ type: "tick" }), 1000);
		return () => {
			clearInterval(timer);
			armButton.current?.focus();
		};
	}, [armed, send]);

	const onKey = (on: "confirm" | "cancel") => (event: React.KeyboardEvent) => {
		if (["Enter", " ", "Escape"].includes(event.key)) {
			event.preventDefault();
			send({ type: "key", key: event.key, on });
		}
	};

	if (state.phase === "armed") {
		return (
			<div
				data-slot="confirm-two-step"
				data-state="armed"
				className={cn("flex flex-wrap gap-2", className)}
			>
				<Button
					ref={confirmButton}
					variant="destructive"
					onClick={() => send({ type: "confirm" })}
					onKeyDown={onKey("confirm")}
				>
					<span aria-live="polite">{confirmLabel(state.remaining)}</span>
				</Button>
				<Button
					variant="outline"
					onClick={() => send({ type: "cancel" })}
					onKeyDown={onKey("cancel")}
				>
					{cancelLabel}
				</Button>
			</div>
		);
	}

	return (
		<div
			data-slot="confirm-two-step"
			data-state="idle"
			className={cn("flex", className)}
		>
			<Button
				ref={armButton}
				variant="destructive"
				disabled={disabled}
				onClick={() => send({ type: "arm", seconds })}
			>
				{label}…
			</Button>
		</div>
	);
}

export { ConfirmTwoStep, type ConfirmTwoStepProps };
