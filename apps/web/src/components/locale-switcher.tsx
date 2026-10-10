"use client";

import { LanguageSwitcher } from "@codesphere/ui/components/molecules/language-switcher";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { isLocale, type Locale } from "@/i18n/config";

// Persists the choice in the locale cookie, then re-renders the server tree in that language.
export default function LocaleSwitcher() {
	const locale = useLocale();
	const [isPending, startTransition] = useTransition();

	return (
		<LanguageSwitcher
			value={locale as Locale}
			disabled={isPending}
			onValueChange={(value) => {
				if (isLocale(value)) {
					startTransition(() => setLocale(value));
				}
			}}
		/>
	);
}
