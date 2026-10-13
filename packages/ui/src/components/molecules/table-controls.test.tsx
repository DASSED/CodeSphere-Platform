/// <reference types="bun" />
// The table bricks (#131 follow-up), server-rendered: what each one shows and announces.
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Table, TableBody, TableEmpty, TableHeader, TableRow } from "./table";
import {
	TableBulkBar,
	TablePagination,
	TableSelectCell,
	TableSelectHead,
	TableSortHead,
} from "./table-controls";

const inTable = (node: React.ReactNode) =>
	renderToStaticMarkup(
		<Table>
			<TableHeader>
				<TableRow>{node}</TableRow>
			</TableHeader>
		</Table>,
	);

describe("TableSortHead", () => {
	test("marks only the sorted column, in its direction", () => {
		const sorted = inTable(
			<TableSortHead
				sortKey="name"
				sort={{ key: "name", direction: "desc" }}
				onSortChange={() => {}}
			>
				Nom
			</TableSortHead>,
		);
		expect(sorted).toContain('aria-sort="descending"');
		const other = inTable(
			<TableSortHead
				sortKey="date"
				sort={{ key: "name", direction: "desc" }}
				onSortChange={() => {}}
			>
				Date
			</TableSortHead>,
		);
		expect(other).toContain('aria-sort="none"');
	});
});

describe("selection column", () => {
	test("the header and the rows are named for assistive technology", () => {
		const html = inTable(
			<>
				<TableSelectHead state="some" onToggle={() => {}} />
				<TableSelectCell
					label="Sélectionner Awa K."
					checked
					onCheckedChange={() => {}}
				/>
			</>,
		);
		expect(html).toContain('aria-label="Sélectionner toute la page"');
		expect(html).toContain('aria-label="Sélectionner Awa K."');
	});
});

describe("TablePagination", () => {
	test("shows the page and the range, and stops at the ends", () => {
		const html = renderToStaticMarkup(
			<TablePagination
				page={1}
				pageCount={5}
				pageSize={10}
				total={47}
				onPageChange={() => {}}
			/>,
		);
		expect(html).toContain("1–10 sur 47");
		expect(html).toContain("Page 1 sur 5");
		// « Précédent » is disabled on the first page, « Suivant » is not.
		expect(html).toMatch(
			/disabled=""[^>]*>[^<]*(<svg[^>]*>.*?<\/svg>)?Précédent/s,
		);
	});
});

describe("TableBulkBar", () => {
	test("renders nothing without a selection", () => {
		expect(
			renderToStaticMarkup(<TableBulkBar count={0} onClear={() => {}} />),
		).toBe("");
	});

	test("counts the checked rows, with the singular and the plural", () => {
		expect(
			renderToStaticMarkup(<TableBulkBar count={1} onClear={() => {}} />),
		).toContain("1 sélectionné<");
		expect(
			renderToStaticMarkup(<TableBulkBar count={3} onClear={() => {}} />),
		).toContain("3 sélectionnés");
	});
});

describe("Table", () => {
	test("maxHeight makes the body scroll under a sticky header; without it nothing changes", () => {
		const bounded = renderToStaticMarkup(<Table maxHeight={240} />);
		expect(bounded).toContain("max-height:240px");
		expect(bounded).toContain("thead_th]:sticky");
		const plain = renderToStaticMarkup(<Table />);
		expect(plain).not.toContain("max-height");
		expect(plain).not.toContain("sticky");
	});

	test("a selected row is marked, an unmarked one carries no aria-selected", () => {
		const html = renderToStaticMarkup(
			<Table>
				<TableBody>
					<TableRow selected />
					<TableRow />
				</TableBody>
			</Table>,
		);
		expect(html).toContain('aria-selected="true"');
		expect(html.match(/aria-selected/g)?.length).toBe(1);
	});

	test("TableEmpty spans every column", () => {
		const html = renderToStaticMarkup(
			<Table>
				<TableBody>
					<TableEmpty colSpan={4}>Aucun résultat.</TableEmpty>
				</TableBody>
			</Table>,
		);
		expect(html).toContain('colSpan="4"');
		expect(html).toContain("Aucun résultat.");
	});
});
