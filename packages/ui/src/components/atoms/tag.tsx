import { cn } from "@codesphere/ui/lib/utils";

function Tag({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="tag"
			className={cn(
				"inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-foreground text-xs",
				className,
			)}
			{...props}
		/>
	);
}

export { Tag };
