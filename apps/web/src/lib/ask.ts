// Rules of the ask form (#68), kept out of the component so they are tested alone. They mirror the
// contract (CreateQuestionInput): the server stays the authority and checks them again.

export type QuestionDraft = {
	title: string;
	body: string;
	tags: string[];
	language: "fr" | "en";
	/** Kept with the Draft: a retry, or a send from the outbox, never asks twice. */
	idempotencyKey: string;
};

export type AskField = "title" | "body" | "tags";
/** `invalid`: refused by the server for a reason the form does not check itself. */
export type AskError = "required" | "tooLong" | "tooManyTags" | "invalid";

/** The steps: title, details, Tags and language, review. */
export const ASK_STEPS = ["title", "details", "tags", "review"] as const;

const LIMITS = { title: 200, body: 20_000, tags: 5 };

/** The fields each step is responsible for. */
const FIELDS_OF: Record<(typeof ASK_STEPS)[number], AskField[]> = {
	title: ["title"],
	details: ["body"],
	tags: ["tags"],
	review: ["title", "body", "tags"],
};

export function fieldError(
	draft: QuestionDraft,
	field: AskField,
): AskError | null {
	switch (field) {
		case "title":
			return !draft.title.trim()
				? "required"
				: draft.title.trim().length > LIMITS.title
					? "tooLong"
					: null;
		case "body":
			return !draft.body.trim()
				? "required"
				: draft.body.length > LIMITS.body
					? "tooLong"
					: null;
		case "tags":
			return draft.tags.length === 0
				? "required"
				: draft.tags.length > LIMITS.tags
					? "tooManyTags"
					: null;
	}
}

/** The errors that keep the Member on `step`, by field. */
export function stepErrors(
	draft: QuestionDraft,
	step: (typeof ASK_STEPS)[number],
): Partial<Record<AskField, AskError>> {
	const out: Partial<Record<AskField, AskError>> = {};
	for (const field of FIELDS_OF[step]) {
		const error = fieldError(draft, field);
		if (error) {
			out[field] = error;
		}
	}
	return out;
}

/** The first step holding an invalid field, e.g. after the server refused a field. */
export function stepOf(field: string): number {
	const index = ASK_STEPS.findIndex(
		(step) => step !== "review" && FIELDS_OF[step].includes(field as AskField),
	);
	return index === -1 ? 0 : index;
}

/** A Draft filled from the page that opened the form: `?tag=cadev-2026` from the Hackathon page. */
export function prefilled(
	draft: QuestionDraft,
	tag: string | null,
): QuestionDraft {
	const clean = tag?.trim().toLowerCase();
	if (
		!clean ||
		draft.tags.includes(clean) ||
		draft.tags.length >= LIMITS.tags
	) {
		return draft;
	}
	return { ...draft, tags: [...draft.tags, clean] };
}
