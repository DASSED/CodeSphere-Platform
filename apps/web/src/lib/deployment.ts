/**
 * Whether this build's deployment has a database. Read at build time (NEXT_PUBLIC_*): a preview
 * without the `preview-db` label is built with `false`, and asks the API for nothing it cannot
 * answer (#157). Anything but "false" counts as a database, so staging and production need no
 * change.
 */
export function hasDatabaseFrom(value: string | undefined): boolean {
	return value !== "false";
}

export const HAS_DATABASE = hasDatabaseFrom(
	process.env.NEXT_PUBLIC_HAS_DATABASE,
);
