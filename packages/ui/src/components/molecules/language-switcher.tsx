"use client";

import { cn } from "@codesphere/ui/lib/utils";

type Locale = "fr" | "en";

type LanguageSwitcherProps = Omit<
	React.ComponentProps<"fieldset">,
	"onChange"
> & {
	value: Locale;
	onValueChange: (value: Locale) => void;
};

const LOCALES: readonly { value: Locale; label: string; name: string }[] = [
	{ value: "fr", label: "FR", name: "Français" },
	{ value: "en", label: "EN", name: "English" },
];

/**
 * French / English switch for the interface. It only reports the choice: the i18n library
 * is not chosen yet (#42), so the caller decides what changing the locale does.
 */
function LanguageSwitcher({
	value,
	onValueChange,
	className,
	...props
}: LanguageSwitcherProps) {
	return (
		<fieldset
			aria-label="Langue de l'interface"
			data-slot="language-switcher"
			className={cn(
				"m-0 inline-flex min-w-0 items-center gap-0.5 rounded-full border border-border bg-card p-0.5 text-xs",
				className,
			)}
			{...props}
		>
			{LOCALES.map((locale) => (
				<button
					key={locale.value}
					type="button"
					lang={locale.value}
					aria-label={locale.name}
					aria-pressed={value === locale.value}
					onClick={() => onValueChange(locale.value)}
					className={cn(
						"rounded-full px-2.5 py-1 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
						value === locale.value
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{locale.label}
				</button>
			))}
		</fieldset>
	);
}

export { LanguageSwitcher, type LanguageSwitcherProps, type Locale };
