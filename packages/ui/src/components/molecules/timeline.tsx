import { cn } from "@codesphere/ui/lib/utils";

type TimelineItem = {
	date: string;
	title: string;
	description?: string;
	state: "done" | "current" | "upcoming";
};

type TimelineProps = Omit<React.ComponentProps<"ol">, "children"> & {
	items: readonly TimelineItem[];
};

/** Vertical timeline, for the « Frise » tab of a hackathon. */
function Timeline({ items, className, ...props }: TimelineProps) {
	return (
		<ol
			data-slot="timeline"
			className={cn("flex flex-col", className)}
			{...props}
		>
			{items.map((item, index) => (
				<li
					key={`${item.date}-${item.title}`}
					data-state={item.state}
					aria-current={item.state === "current" ? "step" : undefined}
					className="relative flex gap-4 pb-6 last:pb-0"
				>
					{index < items.length - 1 && (
						<span
							aria-hidden="true"
							className={cn(
								"absolute top-4 bottom-0 left-[7px] w-px",
								item.state === "done" ? "bg-primary" : "bg-border",
							)}
						/>
					)}
					<span
						aria-hidden="true"
						className={cn(
							"relative mt-1 size-4 shrink-0 rounded-full border-2",
							item.state === "done" && "border-primary bg-primary",
							item.state === "current" &&
								"border-primary bg-background ring-4 ring-primary/20",
							item.state === "upcoming" && "border-border bg-background",
						)}
					/>
					<div className="flex min-w-0 flex-col gap-0.5">
						<time className="font-mono text-muted-foreground text-xs">
							{item.date}
						</time>
						<p
							className={cn(
								"font-medium text-sm",
								item.state === "upcoming" && "text-muted-foreground",
							)}
						>
							{item.title}
						</p>
						{item.description && (
							<p className="text-muted-foreground text-sm">
								{item.description}
							</p>
						)}
					</div>
				</li>
			))}
		</ol>
	);
}

export { Timeline, type TimelineItem, type TimelineProps };
