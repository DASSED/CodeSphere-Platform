"use client";

import { Button } from "@codesphere/ui/components/atoms/button";
import { cn } from "@codesphere/ui/lib/utils";

type TagPickerProps = Omit<
	React.ComponentProps<"section">,
	"children" | "onSubmit"
> & {
	tags: readonly string[];
	value: readonly string[];
	onValueChange: (value: string[]) => void;
	/** Tags required to continue; the step can still be skipped (spec §3, Flux). */
	min?: number;
	onSubmit: () => void;
	onSkip: () => void;
};

/** Onboarding step: pick at least `min` Tags to follow, or skip the step. */
function TagPicker({
	tags,
	value,
	onValueChange,
	min = 3,
	onSubmit,
	onSkip,
	className,
	...props
}: TagPickerProps) {
	const toggle = (tag: string) =>
		onValueChange(
			value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag],
		);
	const missing = Math.max(0, min - value.length);

	return (
		<section
			data-slot="tag-picker"
			className={cn(
				"flex flex-col gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground",
				className,
			)}
			{...props}
		>
			<header className="flex flex-col gap-1">
				<h2 className="font-semibold text-xl tracking-tight">
					Que voulez-vous suivre ?
				</h2>
				<p className="text-muted-foreground text-sm">
					Choisissez au moins {min} tags : votre fil « Pour toi » s'appuie
					dessus.
				</p>
			</header>
			<ul className="flex flex-wrap gap-2">
				{tags.map((tag) => {
					const selected = value.includes(tag);
					return (
						<li key={tag}>
							<button
								type="button"
								aria-pressed={selected}
								onClick={() => toggle(tag)}
								className={cn(
									"rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
									selected
										? "border-primary bg-primary text-primary-foreground"
										: "border-border text-muted-foreground hover:border-primary hover:text-foreground",
								)}
							>
								# {tag}
							</button>
						</li>
					);
				})}
			</ul>
			<footer className="flex flex-wrap items-center justify-between gap-3">
				<p aria-live="polite" className="text-muted-foreground text-xs">
					{missing > 0
						? `Encore ${missing} tag${missing > 1 ? "s" : ""} à choisir`
						: `${value.length} tags suivis`}
				</p>
				<div className="flex gap-2">
					<Button type="button" variant="ghost" onClick={onSkip}>
						Passer
					</Button>
					<Button type="button" disabled={missing > 0} onClick={onSubmit}>
						Continuer
					</Button>
				</div>
			</footer>
		</section>
	);
}

export { TagPicker, type TagPickerProps };
