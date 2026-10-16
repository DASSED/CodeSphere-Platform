"use client";

import { Label } from "@codesphere/ui/components/atoms/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@codesphere/ui/components/molecules/select";
import { cn } from "@codesphere/ui/lib/utils";
import { useId } from "react";

type Option = { value: string; label: string };

type FeedFiltersProps = Omit<
	React.ComponentProps<"div">,
	"children" | "onChange"
> & {
	language: string;
	onLanguageChange: (value: string) => void;
	country: string;
	onCountryChange: (value: string) => void;
	languages?: readonly Option[];
	countries: readonly Option[];
	/** One line with no visible labels (kept for screen readers), to sit beside other controls. */
	compact?: boolean;
};

const DEFAULT_LANGUAGES: readonly Option[] = [
	{ value: "all", label: "Toutes les langues" },
	{ value: "fr", label: "Français" },
	{ value: "en", label: "English" },
];

/** Optional language and country filters of the feed. They filter; they never boost (spec §3, Flux). */
function FeedFilters({
	language,
	onLanguageChange,
	country,
	onCountryChange,
	languages = DEFAULT_LANGUAGES,
	countries,
	compact,
	className,
	...props
}: FeedFiltersProps) {
	const languageId = useId();
	const countryId = useId();
	return (
		<div
			data-slot="feed-filters"
			className={cn(
				"flex flex-wrap gap-3",
				compact ? "items-center" : "items-end",
				className,
			)}
			{...props}
		>
			<div className="flex min-w-44 flex-col gap-1.5">
				<Label htmlFor={languageId} className={cn(compact && "sr-only")}>
					Langue
				</Label>
				<Select
					value={language}
					onValueChange={(value) => value && onLanguageChange(value)}
					items={[...languages]}
				>
					<SelectTrigger id={languageId}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{languages.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex min-w-44 flex-col gap-1.5">
				<Label htmlFor={countryId} className={cn(compact && "sr-only")}>
					Pays
				</Label>
				<Select
					value={country}
					onValueChange={(value) => value && onCountryChange(value)}
					items={[...countries]}
				>
					<SelectTrigger id={countryId}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{countries.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

export { FeedFilters, type FeedFiltersProps, type Option };
