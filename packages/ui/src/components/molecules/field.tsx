import { Label } from "@codesphere/ui/components/atoms/label";
import { cn } from "@codesphere/ui/lib/utils";

/** The ids a control needs to point at its description and its error, for `aria-describedby`. */
function fieldIds(id: string) {
	return { descriptionId: `${id}-description`, errorId: `${id}-error` };
}

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
	/** The id of the control, used for the label and the helper ids (see `fieldIds`). */
	id: string;
	label: string;
	description?: string;
	/** Validation message of the field; it is announced to screen readers. */
	error?: string;
	required?: boolean;
	children: React.ReactNode;
};

/** A label, a control, a hint and a per-field validation error. */
function Field({
	id,
	label,
	description,
	error,
	required,
	className,
	children,
	...props
}: FieldProps) {
	const { descriptionId, errorId } = fieldIds(id);
	return (
		<div
			data-slot="field"
			data-invalid={error ? "" : undefined}
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		>
			<Label htmlFor={id}>
				{label}
				{required && (
					<span aria-hidden="true" className="text-destructive">
						*
					</span>
				)}
			</Label>
			{children}
			{description && !error && (
				<p id={descriptionId} className="text-muted-foreground text-xs">
					{description}
				</p>
			)}
			{error && (
				<p
					id={errorId}
					role="alert"
					className="font-medium text-destructive text-xs"
				>
					{error}
				</p>
			)}
		</div>
	);
}

export { Field, type FieldProps, fieldIds };
