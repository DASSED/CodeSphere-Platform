import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["@codesphere/ui", "@codesphere/contract"],
  // Next would otherwise generate apps/web/AGENTS.md on every dev start.
  agentRules: false,
};

export default withVarlock(nextConfig);
