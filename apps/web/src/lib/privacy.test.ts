import { expect, test } from "bun:test";

import { exportFileName } from "./privacy";

test("the export file is named after the local day", () => {
	expect(exportFileName(new Date(2026, 9, 4, 23, 59))).toBe(
		"codesphere-export-2026-10-04.json",
	);
});
