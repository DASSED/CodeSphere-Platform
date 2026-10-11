import { createAuth } from "@codesphere/auth";
import { createEdgeDb } from "@codesphere/db/edge";
import { createLogger } from "@codesphere/logger";
import type { ExecutionContext, Hono } from "hono";

import { type AppDeps, createApp } from "./app";

/**
 * Cloudflare Worker entry for the API (pull request previews, staging; #103).
 *
 * No `varlock/auto-load`, no Node tracer, no process signals: configuration arrives as
 * Worker bindings (`wrangler preview --var` and `--secrets-file`), the database is reached
 * over HTTP, and logs are JSON lines on the console that Workers Logs collects.
 */
export type WorkerEnv = {
	DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
	ADMIN_EMAILS?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	GITLAB_CLIENT_ID?: string;
	GITLAB_CLIENT_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	OAUTH_PROXY_SECRET?: string;
	OAUTH_PROXY_PRODUCTION_URL?: string;
	LOG_LEVEL?:
		| "fatal"
		| "error"
		| "warn"
		| "info"
		| "debug"
		| "trace"
		| "silent";
	APP_VERSION?: string;
	GIT_SHA?: string;
};

const REQUIRED = [
	"DATABASE_URL",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"CORS_ORIGIN",
] as const;

/** Paths this entry serves; everything else belongs to the web application. */
const API_PREFIXES = ["/api/auth", "/api/v1", "/rpc", "/mcp"] as const;

export function isApiPath(pathname: string): boolean {
	return API_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

/** The Workers execution context, as Hono types it (no workers-types dependency). */
export type WorkerContext = ExecutionContext;

let cached: { key: string; app: Hono<never> } | undefined;

function buildApp(env: WorkerEnv) {
	const missing = REQUIRED.filter((name) => !env[name]);
	if (missing.length > 0) {
		throw new Error(`Worker is missing bindings: ${missing.join(", ")}`);
	}
	const db = createEdgeDb(env);
	const logger = createLogger({
		level: env.LOG_LEVEL ?? "info",
		// Console, not stdout: there is no file descriptor to write to on Workers.
		destination: { write: (line) => console.log(line.trimEnd()) },
	});
	const deps: AppDeps = {
		auth: createAuth(env, db),
		db,
		logger,
		corsOrigin: env.CORS_ORIGIN,
		// Behind Cloudflare, x-forwarded-for is set by the platform.
		trustProxy: true,
		release: {
			version: env.APP_VERSION ?? "dev",
			commit: env.GIT_SHA ?? "dev",
		},
	};
	return createApp(deps) as unknown as Hono<never>;
}

/** Built once per isolate: every service is stateless over HTTP. */
export function apiFetch(
	request: Request,
	env: WorkerEnv,
	ctx: WorkerContext,
): Response | Promise<Response> {
	const key = `${env.BETTER_AUTH_URL}|${env.DATABASE_URL}`;
	if (!cached || cached.key !== key) {
		cached = { key, app: buildApp(env) };
	}
	return cached.app.fetch(request, env, ctx);
}
