import {
	KpiCard,
	type KpiCardProps,
} from "@codesphere/ui/components/molecules/kpi-card";
import { cn } from "@codesphere/ui/lib/utils";

type KpiGridProps = Omit<React.ComponentProps<"div">, "children"> & {
	items: readonly (KpiCardProps & { id: string })[];
};

function KpiGrid({ items, className, ...props }: KpiGridProps) {
	return (
		<div
			data-slot="kpi-grid"
			className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
			{...props}
		>
			{items.map(({ id, ...item }) => (
				<KpiCard key={id} {...item} />
			))}
		</div>
	);
}

export { KpiGrid, type KpiGridProps };
