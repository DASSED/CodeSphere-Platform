import { cn } from "@codesphere/ui/lib/utils";

function Logo({
	className,
	compact,
	...props
}: React.ComponentProps<"span"> & { compact?: boolean }) {
	return (
		<span
			data-slot="logo"
			className={cn(
				"inline-flex shrink-0 items-center gap-2 font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			<span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm">
				◍
			</span>
			<span
				data-slot="logo-text"
				className={compact ? "sr-only" : "whitespace-nowrap"}
			>
				CodeSphere Platform
			</span>
		</span>
	);
}

export { Logo };
