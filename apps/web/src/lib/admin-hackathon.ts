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

const stable = (value: unknown): unknown =>
	Array.isArray(value)
		? value.map(stable)
		: value && typeof value === "object"
			? Object.fromEntries(
					Object.entries(value)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([key, item]) => [key, stable(item)]),
				)
			: value;

/** Whether the draft differs from what was loaded, whatever the order of the keys. */
export function isDirty(original: unknown, draft: unknown) {
	return JSON.stringify(stable(original)) !== JSON.stringify(stable(draft));
}
