import { cn } from "@codesphere/ui/lib/utils";

type SeparatorProps = React.ComponentProps<"hr"> & {
	orientation?: "horizontal" | "vertical";
};

function Separator({
	orientation = "horizontal",
	className,
	...props
}: SeparatorProps) {
	return (
		<hr
			aria-orientation={orientation}
			data-slot="separator"
			className={cn(
				"m-0 shrink-0 border-0 bg-border",
				orientation === "horizontal"
					? "h-px w-full"
					: "h-full w-px self-stretch",
				className,
			)}
			{...props}
		/>
	);
}

export { Separator, type SeparatorProps };
