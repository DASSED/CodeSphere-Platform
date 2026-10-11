// Writes the secrets of a pull request preview to a JSON file for `wrangler preview
// --secrets-file`. Reads the environment, skips what is unset, never prints a value.
import { writeFileSync } from "node:fs";

const KEYS = [
	"DATABASE_URL",
	"BETTER_AUTH_SECRET",
	"OAUTH_PROXY_SECRET",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"GITLAB_CLIENT_ID",
	"GITLAB_CLIENT_SECRET",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
];

const REQUIRED = ["DATABASE_URL", "BETTER_AUTH_SECRET"];

const target = process.argv[2];
if (!target) {
	console.error("usage: preview-secrets.mjs <output.json>");
	process.exit(2);
}

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
	console.error(`missing required secrets: ${missing.join(", ")}`);
	process.exit(1);
}

const secrets = Object.fromEntries(
	KEYS.filter((key) => process.env[key]).map((key) => [key, process.env[key]]),
);

writeFileSync(target, JSON.stringify(secrets), { mode: 0o600 });
console.log(`wrote ${Object.keys(secrets).length} secrets`);
