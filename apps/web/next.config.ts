import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withVarlock = varlockNextConfigPlugin();
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Version and commit shown in the footer so a bug report can name the exact build (#42).
const packageJson = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
	version?: string;
};
const version = packageJson.version ?? "0.0.0";
function readGitSha(): string {
	try {
		return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
	} catch {
		return "dev";
	}
}

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["@codesphere/ui", "@codesphere/contract"],
	// Next would otherwise generate apps/web/AGENTS.md on every dev start.
	agentRules: false,
	env: {
		APP_VERSION: version,
		GIT_SHA: process.env.GIT_SHA ?? readGitSha(),
	},
};

export default withVarlock(withNextIntl(nextConfig));
