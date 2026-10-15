"use client";

import { useTranslations } from "next-intl";

/** The TagInput texts in the interface language: the component defaults to French. */
export function useTagInputLabels() {
	const t = useTranslations("tagInput");
	return {
		placeholder: t("placeholder"),
		removeLabel: (tag: string) => t("remove", { tag }),
		fullPlaceholder: (max: number) => t("full", { max }),
	};
}
