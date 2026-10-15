// `bun run db:preview:studio -- <pr number>`: opens Drizzle Studio on the Neon database of a
// pull request's preview (branch `preview/pr-<n>`, created by .github/workflows/preview.yml).
// `bun run db:preview:studio -- --branch staging` opens any other Neon branch instead.
//
// Needs NEON_API_KEY (a personal key: Neon console > Account settings > API keys) and
// NEON_PROJECT_ID (the same value as the repository variable). The connection string is passed
// to Studio through the environment only: it is never printed.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbPackage = resolve(root, "packages/db");

/** The Neon branch named by the arguments: a PR number, or `--branch <name>`. */
export function branchFrom(args) {
	const at = args.indexOf("--branch");
	if (at !== -1) return args[at + 1] || null;
	const pr = args.find((arg) => /^#?\d+$/.test(arg));
	return pr ? `preview/pr-${pr.replace("#", "")}` : null;
}

function fail(message) {
	console.error(message);
	process.exit(1);
}

if (import.meta.main) {
	const branch = branchFrom(process.argv.slice(2));
	if (!branch) {
		fail(
			"Usage: bun run db:preview:studio -- <pr number>  (or -- --branch <neon branch>)",
		);
	}
	const { NEON_API_KEY, NEON_PROJECT_ID } = process.env;
	if (!NEON_API_KEY || !NEON_PROJECT_ID) {
		fail("Set NEON_API_KEY and NEON_PROJECT_ID first.");
	}

	console.info(`> connection string of the Neon branch ${branch}`);
	const lookup = spawnSync(
		process.execPath,
		[
			"x",
			"neonctl@2",
			"connection-string",
			branch,
			"--project-id",
			NEON_PROJECT_ID,
			"--api-key",
			NEON_API_KEY,
		],
		{ cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
	);
	const url = lookup.stdout?.trim();
	if (lookup.status !== 0 || !url) {
		fail(
			`No database for ${branch}: is the preview deployed (or already removed when the pull request closed)?`,
		);
	}

	// Foreground: Ctrl+C stops Studio. Studio opens on https://local.drizzle.studio.
	console.info("> drizzle studio (https://local.drizzle.studio)");
	const studio = spawnSync(process.execPath, ["x", "drizzle-kit", "studio"], {
		cwd: dbPackage,
		stdio: "inherit",
		env: { ...process.env, DATABASE_URL: url },
	});
	process.exit(studio.status ?? 1);
}
