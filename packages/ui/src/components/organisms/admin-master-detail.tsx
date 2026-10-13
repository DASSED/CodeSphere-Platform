import { cn } from "@codesphere/ui/lib/utils";

type AdminMasterDetailProps = Omit<React.ComponentProps<"div">, "children"> & {
	/** The list, usually a `GroupedList`: fixed on the left, it scrolls on its own. */
	list: React.ReactNode;
	/** The selected record, usually a `RecordSheet`. */
	detail: React.ReactNode;
};

/**
 * The admin list/detail layout (#117): the list stays put on the left (sticky, under the fixed
 * page header) while the record scrolls on the right. Below 760 px they stack.
 */
function AdminMasterDetail({
	list,
	detail,
	className,
	...props
}: AdminMasterDetailProps) {
	return (
		<div
			data-slot="admin-master-detail"
			className={cn(
				"flex flex-col gap-6 min-[760px]:grid min-[760px]:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)] min-[760px]:items-start",
				className,
			)}
			{...props}
		>
			<div className="flex flex-col min-[760px]:sticky min-[760px]:top-28 min-[760px]:max-h-[calc(100svh-8rem)]">
				{list}
			</div>
			<div className="min-w-0">{detail}</div>
		</div>
	);
}

export { AdminMasterDetail, type AdminMasterDetailProps };
