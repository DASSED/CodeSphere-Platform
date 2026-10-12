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
};

function AppHeader<T extends string>({
	tabs,
	activeTab,
	onTabChange,
	actions,
	nav,
	className,
	...props
}: AppHeaderProps<T>) {
	return (
		<header
			data-slot="app-header"
			className={cn(
				"sticky top-0 z-10 border-border border-b bg-background/90 backdrop-blur",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
				<Logo />
				{nav}
				{tabs && activeTab !== undefined && onTabChange && (
					<SegmentedControl
						options={tabs}
						value={activeTab}
						onValueChange={onTabChange}
					/>
				)}
				{actions && <div className="flex items-center gap-3">{actions}</div>}
			</div>
		</header>
	);
}

export { AppHeader, type AppHeaderProps };
