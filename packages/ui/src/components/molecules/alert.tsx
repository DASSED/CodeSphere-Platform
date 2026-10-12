import { cn } from "@codesphere/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva(
	"relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5",
	{
		variants: {
			variant: {
				default: "border-border bg-card text-card-foreground",
				info: "border-border bg-muted/50 text-foreground [&>svg]:text-muted-foreground",
				warning:
					"border-gold/40 bg-gold/10 text-foreground [&>svg]:text-foreground",
				destructive:
					"border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

type AlertProps = React.ComponentProps<"div"> &
	VariantProps<typeof alertVariants>;

function Alert({ variant, className, ...props }: AlertProps) {
	return (
		<div
			role="alert"
			data-slot="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn("col-start-2 font-medium tracking-tight", className)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn(
				"col-start-2 text-muted-foreground text-sm [&_p]:leading-relaxed",
				className,
			)}
			{...props}
		/>
	);
}

export { Alert, AlertDescription, type AlertProps, AlertTitle, alertVariants };
