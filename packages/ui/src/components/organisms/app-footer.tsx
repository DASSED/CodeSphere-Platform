import { cn } from "@codesphere/ui/lib/utils";

type AppFooterProps = Omit<React.ComponentProps<"footer">, "children"> & {
	version: string;
	/** Commit the build was made from; shortened to 7 characters. */
	sha: string;
	links?: readonly { label: string; href: string }[];
	/** Accessible name of the links' navigation, in the reader's language. */
	navLabel?: string;
};

/** Footer with the version and the commit, so a bug report can name the exact build (#42). */
function AppFooter({
	version,
	sha,
	links = [],
	navLabel = "Pied de page",
	className,
	...props
}: AppFooterProps) {
	return (
		<footer
			data-slot="app-footer"
			className={cn(
				"flex flex-wrap items-center justify-between gap-3 border-border border-t px-4 py-4 text-muted-foreground text-xs md:px-8",
				className,
			)}
			{...props}
		>
			<p>
				CodeSphere <span className="font-mono">v{version}</span>
				{" · "}
				<span className="font-mono" title={sha}>
					{sha.slice(0, 7)}
				</span>
			</p>
			{links.length > 0 && (
				<nav aria-label={navLabel}>
					<ul className="flex flex-wrap gap-4">
						{links.map((link) => (
							<li key={link.href}>
								<a
									href={link.href}
									className="hover:text-foreground hover:underline"
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			)}
		</footer>
	);
}

export { AppFooter, type AppFooterProps };
