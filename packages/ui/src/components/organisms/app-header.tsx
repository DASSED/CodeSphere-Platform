import { Logo } from "@codesphere/ui/components/atoms/logo";
import { SegmentedControl } from "@codesphere/ui/components/molecules/segmented-control";
import { cn } from "@codesphere/ui/lib/utils";

type AppHeaderProps<T extends string> = Omit<
	React.ComponentProps<"header">,
	"children"
> & {
	/** Feed tabs; omitted on pages without a feed, where the header is just the site's bar. */
	tabs?: readonly T[];
	activeTab?: T;
	onTabChange?: (tab: T) => void;
	/** Left of the actions, e.g. site links. */
	nav?: React.ReactNode;
	/** Right-hand actions, e.g. the « + Question » button and the avatar. */
	actions?: React.ReactNode;
	/** Where the logo leads, the home page by default. */
	homeHref?: string;
	/** The router's link component (next/link). Defaults to a plain `a`. */
	LinkComponent?: React.ElementType;
	/** Accessible name of the logo link, e.g. « Accueil ». */
	homeLabel?: string;
};

function AppHeader<T extends string>({
	tabs,
	activeTab,
	onTabChange,
	actions,
	nav,
	homeHref = "/",
	LinkComponent = "a",
	homeLabel = "Accueil",
	className,
	...props
}: AppHeaderProps<T>) {
	const Link = LinkComponent;
	return (
		<header
			data-slot="app-header"
			className={cn(
				"sticky top-0 z-10 border-border border-b bg-background/90 backdrop-blur",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
				{/* On a phone the mark alone: the name stays readable by screen readers. */}
				<Link
					href={homeHref}
					aria-label={homeLabel}
					className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<Logo className="[&>[data-slot=logo-text]]:max-sm:sr-only" />
				</Link>
				{nav}
				{tabs && activeTab !== undefined && onTabChange && (
					<SegmentedControl
						options={tabs}
						value={activeTab}
						onValueChange={onTabChange}
					/>
				)}
				{actions && (
					<div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
						{actions}
					</div>
				)}
			</div>
		</header>
	);
}

export { AppHeader, type AppHeaderProps };
