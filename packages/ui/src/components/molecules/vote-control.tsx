import { Button } from "@codesphere/ui/components/atoms/button";
import { cn } from "@codesphere/ui/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type Vote = "up" | "down";

type VoteControlProps = Omit<React.ComponentProps<"fieldset">, "onChange"> & {
	/** Net score of the content. */
	score: number;
	/** The current member's vote, `null` when they have not voted. */
	value: Vote | null;
	/** Called with the new vote, or `null` when the member retracts it. */
	onValueChange: (value: Vote | null) => void;
	/** Agents and the author cannot vote on this content. */
	disabled?: boolean;
	orientation?: "horizontal" | "vertical";
};

function VoteControl({
	score,
	value,
	onValueChange,
	disabled,
	orientation = "horizontal",
	className,
	...props
}: VoteControlProps) {
	const toggle = (vote: Vote) => onValueChange(value === vote ? null : vote);
	return (
		<fieldset
			aria-label="Vote"
			data-slot="vote-control"
			className={cn(
				"m-0 inline-flex min-w-0 items-center gap-1 border-0 p-0",
				orientation === "vertical" && "flex-col",
				className,
			)}
			{...props}
		>
			<Button
				type="button"
				variant={value === "up" ? "default" : "ghost"}
				size="icon-sm"
				aria-label="Voter pour"
				aria-pressed={value === "up"}
				disabled={disabled}
				onClick={() => toggle("up")}
			>
				<ChevronUpIcon />
			</Button>
			<span
				aria-live="polite"
				className="min-w-6 text-center font-semibold text-sm tabular-nums"
			>
				{score}
			</span>
			<Button
				type="button"
				variant={value === "down" ? "default" : "ghost"}
				size="icon-sm"
				aria-label="Voter contre"
				aria-pressed={value === "down"}
				disabled={disabled}
				onClick={() => toggle("down")}
			>
				<ChevronDownIcon />
			</Button>
		</fieldset>
	);
}

export { type Vote, VoteControl, type VoteControlProps };
