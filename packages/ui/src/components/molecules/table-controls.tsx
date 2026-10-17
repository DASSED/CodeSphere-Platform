"use client";

// The interactive pieces of the admin table (#131 follow-up). All of them are controlled: the
// caller owns the sort, the selection and the page, and does the sorting and slicing itself.
// The markup of the selection column, the `⋯` trigger and the pager follows blocks.so
// `table-05`, rewritten without TanStack Table.

import { Button } from "@codesphere/ui/components/atoms/button";
import { Checkbox } from "@codesphere/ui/components/atoms/checkbox";
import {
	TableCell,
	TableHead,
} from "@codesphere/ui/components/molecules/table";
import {
	ariaSort,
	clampPage,
	nextSort,
	type PageSelectionState,
	pageRange,
	type SortState,
} from "@codesphere/ui/components/molecules/table-state";
import { cn } from "@codesphere/ui/lib/utils";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
} from "lucide-react";

type TableSortHeadProps = Omit<
	React.ComponentProps<"th">,
	"onClick" | "aria-sort"
> & {
	/** The key reported to `onSortChange`, and compared to `sort.key`. */
	sortKey: string;
	sort: SortState;
	onSortChange: (sort: SortState) => void;
};

/** A column header that sorts: a button with the arrow, and `aria-sort` on the cell. */
function TableSortHead({
	sortKey,
	sort,
	onSortChange,
	className,
	children,
	...props
}: TableSortHeadProps) {
	const state = ariaSort(sort, sortKey);
	const Icon =
		state === "ascending"
			? ArrowUpIcon
			: state === "descending"
				? ArrowDownIcon
				: ChevronsUpDownIcon;
	return (
		<TableHead aria-sort={state} className={className} {...props}>
			<button
				type="button"
				onClick={() => onSortChange(nextSort(sort, sortKey))}
				className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
			>
				{children}
				<Icon
					aria-hidden="true"
					className={cn("size-3.5", state === "none" && "opacity-40")}
				/>
			</button>
		</TableHead>
	);
}

/** The header checkbox of the selection column: none, some (indeterminate) or all of the page. */
function TableSelectHead({
	state,
	onToggle,
	label = "Sélectionner toute la page",
	disabled,
	className,
}: {
	state: PageSelectionState;
	onToggle: () => void;
	label?: string;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<TableHead className={cn("w-10", className)}>
			<Checkbox
				aria-label={label}
				checked={state === "all"}
				indeterminate={state === "some"}
				disabled={disabled}
				onCheckedChange={onToggle}
			/>
		</TableHead>
	);
}

/** The checkbox of one row; `label` names the row (« Sélectionner Awa K. »). */
function TableSelectCell({
	checked,
	onCheckedChange,
	label,
	disabled,
	className,
}: {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	label: string;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<TableCell className={cn("w-10", className)}>
			<Checkbox
				aria-label={label}
				checked={checked}
				disabled={disabled}
				onCheckedChange={(value) => onCheckedChange(value === true)}
			/>
		</TableCell>
	);
}

type TablePaginationProps = {
	/** 1-based. */
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	/** With `pageSize`, shows « 11–20 sur 47 ». */
	total?: number;
	pageSize?: number;
	previousLabel?: string;
	nextLabel?: string;
	pageLabel?: (page: number, pageCount: number) => string;
	rangeLabel?: (from: number, to: number, total: number) => string;
	className?: string;
};

/** Previous / next under a table. It slices nothing: the caller fetches the page asked for. */
function TablePagination({
	page,
	pageCount,
	onPageChange,
	total,
	pageSize,
	previousLabel = "Précédent",
	nextLabel = "Suivant",
	pageLabel = (current, count) => `Page ${current} sur ${count}`,
	rangeLabel = (from, to, count) => `${from}–${to} sur ${count}`,
	className,
}: TablePaginationProps) {
	const current = clampPage(page, pageCount);
	const range =
		total !== undefined && pageSize !== undefined
			? pageRange(current, pageSize, total)
			: null;
	return (
		<nav
			data-slot="table-pagination"
			aria-label="Pagination"
			className={cn(
				"flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs",
				className,
			)}
		>
			<span aria-live="polite" className="tabular-nums">
				{range && total !== undefined
					? `${rangeLabel(range.from, range.to, total)} · `
					: ""}
				{pageLabel(current, Math.max(1, pageCount))}
			</span>
			<span className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={current <= 1}
					onClick={() => onPageChange(current - 1)}
				>
					<ChevronLeftIcon />
					{previousLabel}
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={current >= pageCount}
					onClick={() => onPageChange(current + 1)}
				>
					{nextLabel}
					<ChevronRightIcon />
				</Button>
			</span>
		</nav>
	);
}

type TableBulkBarProps = {
	/** How many rows are checked; the bar is not rendered at 0. */
	count: number;
	onClear: () => void;
	/** The actions on the checked rows; destructive ones go through the reason dialog. */
	actions?: React.ReactNode;
	countLabel?: (count: number) => string;
	clearLabel?: string;
	className?: string;
};

/** The sticky bar of the checked rows: « 3 sélectionnés », « Tout désélectionner », actions. */
function TableBulkBar({
	count,
	onClear,
	actions,
	countLabel = (value) =>
		value > 1 ? `${value} sélectionnés` : `${value} sélectionné`,
	clearLabel = "Tout désélectionner",
	className,
}: TableBulkBarProps) {
	if (count <= 0) {
		return null;
	}
	return (
		<section
			data-slot="table-bulk-bar"
			aria-label="Actions groupées"
			className={cn(
				"sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2 shadow-md",
				className,
			)}
		>
			<span aria-live="polite" className="font-medium text-sm tabular-nums">
				{countLabel(count)}
			</span>
			<span className="flex flex-wrap gap-2">
				{actions}
				<Button variant="ghost" size="sm" onClick={onClear}>
					{clearLabel}
				</Button>
			</span>
		</section>
	);
}

export {
	TableBulkBar,
	type TableBulkBarProps,
	TablePagination,
	type TablePaginationProps,
	TableSelectCell,
	TableSelectHead,
	TableSortHead,
	type TableSortHeadProps,
};
