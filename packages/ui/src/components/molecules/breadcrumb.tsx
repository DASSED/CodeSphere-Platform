import { cn } from "@codesphere/ui/lib/utils";
import { ChevronRightIcon } from "lucide-react";

type BreadcrumbItem = {
	label: string;
	/** Where the step leads. Without it, or for the last item, the step is plain text. */
	href?: string;
};

type BreadcrumbProps = Omit<React.ComponentProps<"nav">, "children"> & {
	items: readonly BreadcrumbItem[];
	/** The link element, e.g. `next/link`; a plain `<a>` by default. */
	linkAs?: React.ElementType;
};

/** The path to the current page. The last item is the page itself (`aria-current="page"`). */
function Breadcrumb({
	items,
	linkAs: Link = "a",
	className,
	...props
}: BreadcrumbProps) {
	return (
		<nav
			data-slot="breadcrumb"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		>
			<ol className="flex flex-wrap items-center gap-1.5">
				{items.map((item, index) => {
					const last = index === items.length - 1;
					return (
						<li
							key={`${item.label}-${index}`}
							className="flex min-w-0 items-center gap-1.5"
						>
							{index > 0 && (
								<ChevronRightIcon aria-hidden className="size-3.5 shrink-0" />
							)}
							{last || !item.href ? (
								<span
									aria-current={last ? "page" : undefined}
									className={cn(
										"max-w-[min(36rem,70vw)] truncate",
										last && "font-medium text-foreground",
									)}
								>
									{item.label}
								</span>
							) : (
								<Link
									href={item.href}
									className="rounded-sm underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
								>
									{item.label}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps };
