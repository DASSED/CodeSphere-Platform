import { cn } from "@codesphere/ui/lib/utils";

function Logo({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="logo"
			className={cn(
				"inline-flex items-center gap-2 font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			<span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground text-sm">
				◍
			</span>
			CodeSphere
		</span>
	);
}

export { Logo };
