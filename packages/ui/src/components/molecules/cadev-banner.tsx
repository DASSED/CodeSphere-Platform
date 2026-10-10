import { cn } from "@codesphere/ui/lib/utils";

type CadevBannerProps = React.ComponentProps<"section"> & {
	name: string;
	summary: string;
	/** Days before submission closes; `null` while unknown. */
	daysLeft: number | null;
	/** Rendered as the call-to-action, e.g. a link to the rules. */
	action?: React.ReactNode;
};

function CadevBanner({
	name,
	summary,
	daysLeft,
	action,
	className,
	...props
}: CadevBannerProps) {
	return (
		<section
			data-slot="cadev-banner"
			className={cn(
				"relative overflow-hidden rounded-xl border border-border bg-primary p-7 text-primary-foreground",
				className,
			)}
			{...props}
		>
			<p className="font-semibold text-xs uppercase tracking-widest opacity-80">
				Hackathon en cours
			</p>
			<h2 className="mt-2 max-w-xl font-bold text-2xl leading-tight">{name}</h2>
			<p className="mt-2 max-w-xl text-sm opacity-90">{summary}</p>
			<div className="mt-5 flex items-end gap-6">
				<div>
					<span className="font-bold text-5xl tabular-nums">
						{daysLeft ?? "…"}
					</span>
					<span className="ml-2 text-sm opacity-80">
						jours avant la clôture
					</span>
				</div>
				{action && <div className="ml-auto">{action}</div>}
			</div>
		</section>
	);
}

export { CadevBanner, type CadevBannerProps };
