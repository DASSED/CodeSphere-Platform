// `bun run db:local`: brings the local database up and makes it current.
//   1. starts the `postgres` service of docker-compose.yml and waits for its healthcheck;
//   2. applies the migrations;
//   3. runs the idempotent seed (`bun run db:local -- --no-seed` skips it).
// `bun run db:local:studio` does the same, then opens Drizzle Studio on the database so each
// migration or seed change can be inspected (https://local.drizzle.studio).
//
// DATABASE_URL defaults to the compose database; set it to target another one.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbPackage = resolve(root, "packages/db");
const args = new Set(process.argv.slice(2));

const password = process.env.POSTGRES_PASSWORD ?? "password";
const databaseUrl =
	process.env.DATABASE_URL ??
	`postgresql://postgres:${password}@localhost:5432/codesphere`;
const env = { ...process.env, DATABASE_URL: databaseUrl };

function run(label, command, commandArgs, options = {}) {
	console.info(`\n> ${label}`);
	const result = spawnSync(command, commandArgs, {
		stdio: "inherit",
		cwd: root,
		env,
		...options,
	});
	if (result.error?.code === "ENOENT") {
		console.error(`"${command}" was not found on PATH.`);
		process.exit(1);
	}
	if (result.status !== 0) {
		console.error(`Failed: ${label}`);
		process.exit(result.status ?? 1);
	}
}

const engine = spawnSync("docker", ["info"], { stdio: "ignore" });
if (engine.error?.code === "ENOENT" || engine.status !== 0) {
	console.error(
		"Docker is not running. Start Docker Desktop (or the docker daemon), then retry.",
	);
	process.exit(1);
}

run("start postgres", "docker", ["compose", "up", "-d", "--wait", "postgres"]);
run("apply migrations", process.execPath, ["x", "drizzle-kit", "migrate"], {
	cwd: dbPackage,
});
if (!args.has("--no-seed")) {
	run("seed", process.execPath, ["src/seed/index.ts"], { cwd: dbPackage });
}

console.info(`\nDatabase ready: ${databaseUrl.replace(/:[^:@/]*@/, ":***@")}`);

if (args.has("--studio")) {
	// Foreground: Ctrl+C stops Studio, the database keeps running (`bun run db:stop` stops it).
	run("drizzle studio", process.execPath, ["x", "drizzle-kit", "studio"], {
		cwd: dbPackage,
	});
}
