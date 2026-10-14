/** Sum of the judging weights; the form blocks saving unless it is 100 (#127). */
export function criteriaTotal(criteria: readonly { weight: number }[]) {
	return criteria.reduce((total, { weight }) => total + weight, 0);
}

const pad = (value: number) => String(value).padStart(2, "0");

/** An ISO instant as the value of `<input type="datetime-local">`, in the reader's zone. */
export function toLocalInput(iso: string | null) {
	if (!iso) {
		return "";
	}
	const date = new Date(iso);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The reverse: a `datetime-local` value (reader's zone) back to an ISO instant, `null` if empty. */
export function fromLocalInput(value: string) {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Whether the draft differs from what was loaded. */
export function isDirty(original: unknown, draft: unknown) {
	return JSON.stringify(original) !== JSON.stringify(draft);
}
