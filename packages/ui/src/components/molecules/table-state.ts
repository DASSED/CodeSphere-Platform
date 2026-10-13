// The headless state of an admin table (#131 follow-up): sort cycle, row selection and
// pagination bounds, kept pure so it is tested without a DOM. The data is never sorted or
// sliced here: the caller (usually the API) does that, the table only reports the intent.

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;

/** The click cycle of a column header: ascending → descending → unsorted. */
export function nextSort(current: SortState, key: string): SortState {
	if (!current || current.key !== key) {
		return { key, direction: "asc" };
	}
	return current.direction === "asc" ? { key, direction: "desc" } : null;
}

export type AriaSort = "ascending" | "descending" | "none";

export function ariaSort(current: SortState, key: string): AriaSort {
	if (!current || current.key !== key) {
		return "none";
	}
	return current.direction === "asc" ? "ascending" : "descending";
}

export type Selection = ReadonlySet<string>;
export type PageSelectionState = "none" | "some" | "all";

export const NO_SELECTION: Selection = new Set<string>();

export function toggleRow(selection: Selection, id: string): Selection {
	const next = new Set(selection);
	if (!next.delete(id)) {
		next.add(id);
	}
	return next;
}

/** How much of the displayed page is selected: drives the header checkbox. */
export function pageSelectionState(
	selection: Selection,
	pageIds: readonly string[],
): PageSelectionState {
	const count = pageIds.filter((id) => selection.has(id)).length;
	if (count === 0) {
		return "none";
	}
	return count === pageIds.length ? "all" : "some";
}

/** The header checkbox: everything selected → clear the page, otherwise select the whole page. */
export function togglePage(
	selection: Selection,
	pageIds: readonly string[],
): Selection {
	const next = new Set(selection);
	if (pageSelectionState(selection, pageIds) === "all") {
		for (const id of pageIds) {
			next.delete(id);
		}
	} else {
		for (const id of pageIds) {
			next.add(id);
		}
	}
	return next;
}

/** Keeps only the rows still displayed, so an action never reaches a row that left the page. */
export function pruneSelection(
	selection: Selection,
	visibleIds: readonly string[],
): Selection {
	const visible = new Set(visibleIds);
	const kept = [...selection].filter((id) => visible.has(id));
	return kept.length === selection.size ? selection : new Set(kept);
}

/** A page number (1-based) forced into `1..pageCount`. */
export function clampPage(page: number, pageCount: number): number {
	return Math.min(Math.max(1, Math.trunc(page) || 1), Math.max(1, pageCount));
}

/** « 11–20 sur 47 »: the 1-based range shown on `page`, `from` 0 when there is no row. */
export function pageRange(page: number, pageSize: number, total: number) {
	if (total <= 0) {
		return { from: 0, to: 0 };
	}
	const from = (page - 1) * pageSize + 1;
	return { from, to: Math.min(total, page * pageSize) };
}
