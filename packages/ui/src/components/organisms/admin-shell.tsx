import { Badge } from "@codesphere/ui/components/atoms/badge";
import { Logo } from "@codesphere/ui/components/atoms/logo";
import { ThemeToggle } from "@codesphere/ui/components/molecules/theme-toggle";
import { cn } from "@codesphere/ui/lib/utils";

type AdminNavItem = {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	active?: boolean;
};

type AdminShellProps = Omit<React.ComponentProps<"div">, "title"> & {
	title: string;
	description?: string;
	nav: readonly AdminNavItem[];
	/** The router's link component (next/link). Defaults to a plain `a`. */
	LinkComponent?: React.ElementType;
	/** Shown at the bottom of the sidebar. */
	user?: { name: string; role: string };
	/** Page-level actions, rendered next to the title. */
	actions?: React.ReactNode;
};

/** Back-office layout: a sidebar on large screens, a scrolling tab bar under the header on small ones. */
function AdminShell({
	title,
	description,
	nav,
	LinkComponent = "a",
	user,
	actions,
	children,
	className,
	...props
}: AdminShellProps) {
	const Link = LinkComponent;
	return (
		<div
			data-slot="admin-shell"
			className={cn(
				"min-h-svh bg-background md:grid md:grid-cols-[14rem_1fr]",
				className,
			)}
			{...props}
		>
			<aside className="flex flex-col gap-3 border-border border-b bg-sidebar p-3 text-sidebar-foreground md:sticky md:top-0 md:h-svh md:gap-6 md:border-r md:border-b-0 md:p-4">
				<div className="flex items-center justify-between gap-2">
					<Logo />
					<Badge variant="outline">Admin</Badge>
				</div>
				<nav
					aria-label="Administration"
					className="-mx-1 overflow-x-auto md:mx-0"
				>
					<ul className="flex gap-1 px-1 md:flex-col md:px-0">
						{nav.map(({ label, href, icon: Icon, active }) => (
							<li key={href} className="shrink-0">
								<Link
									href={href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
										active &&
											"bg-sidebar-accent text-sidebar-accent-foreground",
									)}
								>
									<Icon className="size-4" />
									{label}
								</Link>
							</li>
						))}
					</ul>
				</nav>
				{user && (
					<div className="mt-auto hidden flex-col text-xs md:flex">
						<span className="font-medium">{user.name}</span>
						<span className="text-muted-foreground">{user.role}</span>
					</div>
				)}
			</aside>

			<div className="flex min-w-0 flex-col">
				<header className="flex flex-wrap items-center justify-between gap-3 border-border border-b px-4 py-4 md:px-8">
					<div className="min-w-0">
						<h1 className="truncate font-semibold text-xl tracking-tight">
							{title}
						</h1>
						{description && (
							<p className="text-muted-foreground text-sm">{description}</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						{actions}
						<ThemeToggle />
					</div>
				</header>
				<main className="flex flex-col gap-6 p-4 md:p-8">{children}</main>
			</div>
		</div>
	);
}

export { type AdminNavItem, AdminShell, type AdminShellProps };
