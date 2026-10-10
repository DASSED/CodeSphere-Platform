"use client";

import { cn } from "@codesphere/ui/lib/utils";
import { useEffect, useState } from "react";

type CountdownProps = Omit<React.ComponentProps<"div">, "children"> & {
	/** ISO date the countdown runs to. */
	target: string;
	/** Freeze the clock at this instant (tests, previews). Without it the clock ticks every second. */
	now?: Date;
};

const UNITS = [
	{ key: "days", label: "jours" },
	{ key: "hours", label: "heures" },
	{ key: "minutes", label: "minutes" },
	{ key: "seconds", label: "secondes" },
] as const;

function split(ms: number) {
	const total = Math.floor(ms / 1000);
	return {
		days: Math.floor(total / 86_400),
		hours: Math.floor((total % 86_400) / 3600),
		minutes: Math.floor((total % 3600) / 60),
		seconds: total % 60,
	};
}

/** Countdown to a deadline. Nothing is computed on the server, so the markup never mismatches on hydration. */
function Countdown({ target, now, className, ...props }: CountdownProps) {
	const [current, setCurrent] = useState<number | null>(
		now ? now.getTime() : null,
	);

	useEffect(() => {
		if (now) {
			setCurrent(now.getTime());
			return;
		}
		setCurrent(Date.now());
		const id = setInterval(() => setCurrent(Date.now()), 1000);
		return () => clearInterval(id);
	}, [now]);

	const remaining =
		current === null ? null : Math.max(0, new Date(target).getTime() - current);
	const parts = remaining === null ? null : split(remaining);
	const label =
		parts === null
			? "Compte à rebours"
			: remaining === 0
				? "Le compte à rebours est terminé"
				: `Il reste ${parts.days} jours, ${parts.hours} heures, ${parts.minutes} minutes et ${parts.seconds} secondes`;

	return (
		<div
			role="timer"
			aria-label={label}
			data-slot="countdown"
			data-finished={remaining === 0 ? "" : undefined}
			className={cn("flex items-end gap-3", className)}
			{...props}
		>
			{UNITS.map(({ key, label: unit }) => (
				<div key={key} className="flex min-w-14 flex-col items-center gap-0.5">
					<span aria-hidden="true" className="font-bold text-3xl tabular-nums">
						{parts ? String(parts[key]).padStart(2, "0") : "--"}
					</span>
					<span
						aria-hidden="true"
						className="text-[11px] text-muted-foreground"
					>
						{unit}
					</span>
				</div>
			))}
		</div>
	);
}

export { Countdown, type CountdownProps };
