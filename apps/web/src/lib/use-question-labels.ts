"use client";

import { useTranslations } from "next-intl";

/** The VoteControl texts in the interface language: the component defaults to French. */
export function useVoteLabels() {
	const t = useTranslations("question.vote");
	return { group: t("group"), up: t("up"), down: t("down") };
}

/** The AnswerCard texts in the interface language, its votes included. */
export function useAnswerCardLabels() {
	const t = useTranslations("question.card");
	return {
		accepted: t("accepted"),
		accept: t("accept"),
		copyCode: t("copyCode"),
		copied: t("copied"),
		share: t("share"),
		expand: t("expand"),
		collapse: t("collapse"),
		vote: useVoteLabels(),
	};
}

/** The ConfirmTwoStep texts of the Question page, for deleting a Question or an Answer. */
export function useConfirmLabels() {
	const t = useTranslations("question");
	return {
		confirmLabel: (seconds: number) => t("confirm", { seconds }),
		cancelLabel: t("cancel"),
	};
}
