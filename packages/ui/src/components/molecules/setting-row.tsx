import { cn } from "@codesphere/ui/lib/utils";

type SettingsSectionProps = Omit<React.ComponentProps<"section">, "title"> & {
	title: string;
	description?: string;
};

/** A titled block of the settings page (« Profil public », « Préférences », « Confidentialité »…). */
function SettingsSection({
	title,
	description,
	className,
	children,
	...props
}: SettingsSectionProps) {
	return (
		<section
			data-slot="settings-section"
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
				className,
			)}
			{...props}
		>
			<header className="flex flex-col gap-0.5">
				<h2 className="font-semibold text-base">{title}</h2>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</header>
			<div className="flex flex-col divide-y divide-border">{children}</div>
		</section>
	);
}

type SettingRowProps = Omit<React.ComponentProps<"div">, "title"> & {
	title: string;
	description?: string;
	/** The control (switch, select, button) on the right. */
	children: React.ReactNode;
};

function SettingRow({
	title,
	description,
	className,
	children,
	...props
}: SettingRowProps) {
	return (
		<div
			data-slot="setting-row"
			className={cn(
				"flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0",
				className,
			)}
			{...props}
		>
			<div className="flex min-w-0 flex-col gap-0.5">
				<p className="font-medium text-sm">{title}</p>
				{description && (
					<p className="text-muted-foreground text-xs">{description}</p>
				)}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

export {
	SettingRow,
	type SettingRowProps,
	SettingsSection,
	type SettingsSectionProps,
};
