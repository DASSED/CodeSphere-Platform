/**
 * Whether this build's deployment has a database. Read at build time (NEXT_PUBLIC_*): a build
 * made with `false` asks the API for nothing it cannot answer (#157). Every preview now has its
 * own Neon database, so it is built with `true`. Anything but "false" counts as a database, so staging and production need no
 * change.
 */
export function hasDatabaseFrom(value: string | undefined): boolean {
	return value !== "false";
}

export const HAS_DATABASE = hasDatabaseFrom(
	process.env.NEXT_PUBLIC_HAS_DATABASE,
);
