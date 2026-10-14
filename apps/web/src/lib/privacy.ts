/** The export's file name, dated in the viewer's day: `codesphere-export-2026-10-14.json`. */
export function exportFileName(at: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `codesphere-export-${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}.json`;
}
