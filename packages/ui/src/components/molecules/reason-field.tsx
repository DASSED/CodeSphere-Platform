import { Textarea } from "@codesphere/ui/components/atoms/textarea";
import { Field, fieldIds } from "@codesphere/ui/components/molecules/field";

/** Bounds of a moderation reason, shared with the API's `SuspensionReason` (#123). */
const REASON_MIN = 3;
const REASON_MAX = 280;

/** True when the trimmed reason fits the bounds. */
function isReasonValid(reason: string) {
	const length = reason.trim().length;
	return length >= REASON_MIN && length <= REASON_MAX;
}

type ReasonFieldProps = {
	id: string;
	value: string;
	onValueChange: (value: string) => void;
	label?: string;
	/** Shown once the field has been touched and the reason is too short. */
	tooShortText?: string;
	/** The API's error, e.g. after a refusal. */
	error?: string;
	className?: string;
};

/** The required reason of a suspension (#131): 3 to 280 characters, with a live counter. */
function ReasonField({
	id,
	value,
	onValueChange,
	label = "Raison (obligatoire)",
	tooShortText = `${REASON_MIN} caractères minimum.`,
	error,
	className,
}: ReasonFieldProps) {
	const length = value.trim().length;
	const shown =
		error ?? (value && length < REASON_MIN ? tooShortText : undefined);
	const { errorId } = fieldIds(id);
	const counterId = `${id}-counter`;
	return (
		<Field id={id} label={label} required error={shown} className={className}>
			<Textarea
				id={id}
				value={value}
				maxLength={REASON_MAX}
				required
				aria-invalid={shown ? true : undefined}
				aria-describedby={shown ? `${counterId} ${errorId}` : counterId}
				onChange={(event) => onValueChange(event.target.value)}
			/>
			<span
				id={counterId}
				className="self-end text-muted-foreground text-xs tabular-nums"
			>
				{value.length} / {REASON_MAX}
			</span>
		</Field>
	);
}

export {
	isReasonValid,
	REASON_MAX,
	REASON_MIN,
	ReasonField,
	type ReasonFieldProps,
};
