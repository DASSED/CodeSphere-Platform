# Research: Hono + oRPC on Cloudflare Workers, web on Vercel (staging)

Resolves #80 (map #28; blocks #81). Status: research note, not a decision. Date: 2026-10-09.

## Question

Can the Hono API (written for Bun) run on Cloudflare Workers for staging while Next.js 16 runs on Vercel? Cover the oRPC/Hono
adapter, what is Bun-specific in our code, better-auth / Pino / varlock / Drizzle / orpc-mcp on Workers, Postgres access,
cross-origin auth, SSO redirect URIs, limits, and the deploy pipeline.

Legend: **[V]** verified against the cited primary source on 2026-10-09; **[U]** unverified / general knowledge, check before relying on it.
Repo facts are from `origin/develop` @ 66ccf0e.

## Short answer

Yes, with a small refactor. The fetch-based stack (Hono, oRPC fetch handlers, orpc-mcp fetch handler, better-auth) runs on Workers
with `nodejs_compat`. The real work is (a) replacing module-level singletons with per-request construction, (b) swapping
`varlock/auto-load` for the varlock Cloudflare integration, (c) Postgres through Hyperdrive, and (d) cross-origin cookies, best
avoided by proxying the API through the Vercel web origin (or by a shared parent domain). The Workers Free plan's 10 ms CPU limit is
the main risk; budget for the $5/month Paid plan.

## 1. Hono + oRPC on Workers; what is Bun-specific in our code

- Hono lists Cloudflare Workers as a first-class runtime and `export default app` is the Workers module entry. [V] https://hono.dev/llms.txt , https://hono.dev/docs/getting-started/cloudflare-workers
- oRPC has a dedicated "Cloudflare Workers Adapter": it is the Fetch API adapter (`RPCHandler`, `OpenAPIHandler` from `.../fetch`) with `handler.handle(request, { prefix, context: { env, ctx } })`. It asks for the `enable_request_signal` compatibility flag so `request.signal` aborts on client disconnect. [V] https://orpc.dev/docs/adapters/cloudflare-workers
- oRPC runtime requirements for Workers: "tracks current V8 and ships every Web API oRPC uses". [V] https://orpc.dev/docs/requirements
- orpc-mcp 0.1.3 (latest on npm, peers `@orpc/*` ^2.0.0-beta.16): I unpacked the tarball; only `dist/adapters/stdio` references `node:`/`process`/`Buffer`. The `orpc-mcp/fetch` handler we use has no Node-only code. [V, npm tarball https://registry.npmjs.org/orpc-mcp/-/orpc-mcp-0.1.3.tgz] Not exercised on a real Workers runtime: [U], smoke-test it.

What must change in `apps/server/src` (all from reading the code):

| Where | Issue | Change |
|---|---|---|
| `env.server.ts`: `import "varlock/auto-load"` | Auto-load reads `.env`/schema files at runtime; no filesystem on Workers. | Use `@varlock/cloudflare-integration`: `varlock-wrangler deploy` uploads vars/secrets, and `import '@varlock/cloudflare-integration/init'` in the entry initialises the `ENV` proxy. Requires `nodejs_compat`. [V] https://varlock.dev/integrations/cloudflare/ |
| `index.ts`: `process.once("SIGTERM", ...)`, `process.exit` | Workers have no process lifecycle. | Drop on Workers. |
| `telemetry.ts`: `NodeTracerProvider`, `BatchSpanProcessor` | `sdk-trace-node` assumes Node context manager and background timers. It is opt-in (off without `OTEL_EXPORTER_OTLP_ENDPOINT`). | Leave unset on staging; if wanted, a Workers-compatible exporter flushed with `ctx.waitUntil` [U]. |
| `services.ts`: `createDb(ENV)` / `createAuth(ENV, db)` at module scope | Bindings (Hyperdrive) live on `env`; Workers forbid reusing I/O objects (sockets) across requests [U, general Workers rule; the Hyperdrive doc itself shows a new `Client` per request]. | Build `db`/`auth` per request (or lazily per isolate for stateless parts) from `env`. |
| `packages/db/src/index.ts`: `drizzle(env.DATABASE_URL)` with `node-postgres` | Opens a `pg` Pool on a TCP socket at import. | Per-request `pg` Client from `env.HYPERDRIVE.connectionString` (section 3). |
| `index.ts`: `export const apiHandler/rpcHandler` | Extra named exports on a Workers entry module. | Make them non-exported; Workers treats named exports as entrypoints [U]. |
| `context.ts`, `index.ts` handlers | Pure fetch API (`c.req.raw`, `c.newResponse`). | None. |
| Config reads via `process.env` | Works if `nodejs_compat` + `nodejs_compat_populate_process_env` (default for compat date >= 2025-04-01); populated lazily on first `process` access. [V] https://developers.cloudflare.com/workers/configuration/environment-variables/ | Prefer varlock `ENV` / the `env` param. |
| Build: `bun build --compile`, tsdown, Dockerfile | Not used by Workers; Wrangler bundles with esbuild. Workspace packages export raw `.ts` and should bundle fine [U]. | Add `apps/server/wrangler.jsonc` with `main`, `compatibility_date`, `compatibility_flags: ["nodejs_compat", "enable_request_signal"]`. Keep the Docker path for prod. |

Suggested shape: one runtime-agnostic Hono app factory, plus a Bun `index.ts` (today's behaviour) and a thin Workers `worker.ts` that builds services from `env`.

## 2. Library compatibility, limits, plans

Platform limits [V] https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/workers/platform/pricing/ :

| | Free | Paid ($5/month minimum) |
|---|---|---|
| CPU time per HTTP request | 10 ms | default 30 s, up to 5 min |
| Memory per isolate | 128 MB | 128 MB |
| Worker size (uncompressed) | 64 MiB | 64 MiB |
| Startup time | 1 s | 1 s |
| Subrequests per invocation | 50 | 10,000 |
| Simultaneous outgoing connections | 6 | 6 |
| Requests | 100,000/day | 10M/month included |

Network and DB wait time does not count as CPU. Cloudflare says authentication/SSR-style Workers "typically use 10-20 ms" CPU, so Free's 10 ms is
borderline for better-auth session + Zod + oRPC. Cloudflare also recommends Zod >= 4.5.0 on Workers (memory). [V, same limits page]

`nodejs_compat`: for compatibility dates 2024-09-23 to 2026-08-03 add the flag; from 2026-08-04 it is on by default. Missing Node APIs are
unenv polyfills that may no-op or throw. [V] https://developers.cloudflare.com/workers/runtime-apis/nodejs/

| Library | Verdict |
|---|---|
| better-auth 1.7.5 | Supported pattern: docs say it uses `AsyncLocalStorage`, add `nodejs_compat` (or `nodejs_als`); the Hono integration page covers CORS. [V] https://better-auth.com/docs/integrations/hono . `advanced.backgroundTasks.handler` can be `waitUntil` from `cloudflare:workers`. [V] https://better-auth.com/docs/reference/options . Caveat: in-memory state (e.g. a default rate-limit store) is per-isolate; keep our `apiKey` rate limit in DB/secondary storage [U for this plugin]. |
| Pino / `@codesphere/logger` | Not in the repo yet (spec section 3 plans it; ticket #40). oRPC has a Pino integration (`@orpc/pino`, pino@beta) that needs a `crypto` global (present on Workers). [V] https://orpc.dev/docs/integrations/pino . Pino's Node transports and `pino-pretty` rely on worker threads/streams and do not apply on Workers [U]; log plain JSON to `console` (Workers Logs captures it). Make the logger factory runtime-agnostic. |
| varlock 1.22.0 | Official Cloudflare integration, needs `nodejs_compat`; secrets are uploaded as Cloudflare secrets by `varlock-wrangler`, not bundled. [V] https://varlock.dev/integrations/cloudflare/ |
| Drizzle (`drizzle-orm` catalog, drizzle-kit 1.0.0-rc.4) | Works over Hyperdrive via node-postgres; Hyperdrive docs list Drizzle (min 0.26.2). [V] https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/ . Drizzle 1.0 RC specifically on Workers: [U]. Migrations (drizzle-kit) run from CI against the DB directly, not from the Worker. |
| orpc-mcp 0.1.3 | See section 1. Single-request handling over fetch; stateful MCP sessions/SSE would need Durable Objects [U]. |
| `@orpc/openapi` `OpenAPIGenerator` | Our `OpenAPIReferenceHandlerPlugin` regenerates the spec per request: CPU cost; cache it per isolate. |

## 3. Postgres from Workers

- Workers cannot keep a classic connection pool across requests; Cloudflare's answer is **Hyperdrive** (pooling near the DB plus optional query cache). Use `pg` >= 8.16.3 (docs recommend node-postgres; Postgres.js also supported), `nodejs_compat`, a `hyperdrive` binding, and create a new `Client` per request. [V] https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/ and https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/
- Our `pg ^8.23.0` satisfies the minimum. [V, repo + doc]
- Hyperdrive is included on **Free** (100,000 queries/day, ~20 origin connections) and Paid (unlimited queries, ~100 connections); pooling and caching cost nothing extra. [V] https://developers.cloudflare.com/hyperdrive/platform/pricing/ , https://developers.cloudflare.com/hyperdrive/platform/limits/
- Drizzle: `drizzle(client, { relations })` from `drizzle-orm/node-postgres` with that per-request client.
- Hosted Postgres with documented Hyperdrive guides: Neon, AWS RDS/Aurora, Azure, Google Cloud SQL, Fly, Nile, PlanetScale Postgres, Prisma Postgres, Timescale. [V] https://developers.cloudflare.com/hyperdrive/llms.txt
- Staging pick: **Neon Free** (Postgres 18 availability: [U], check) is the cheapest fit: 1 GB/project, 100 CU-hours, scale-to-zero after 5 min (first query after idle is slower). [V] https://neon.com/docs/introduction/plans . Alternative: Postgres in Docker on the Systalink server, exposed to Hyperdrive through a Cloudflare Tunnel/TLS (private-DB guide https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/ , not read in full): no third vendor, but couples staging to the prod box.

## 4. Cross-origin auth: `*.vercel.app` web, `*.workers.dev` / custom-domain API

Facts:
- `vercel.app` and `workers.dev` are both on the Public Suffix List, so every `x.vercel.app` and `y.workers.dev` is its own *site*: `Domain=` cannot share cookies across them, and the API cookie is third-party from the web page. [V] https://publicsuffix.org/list/public_suffix_list.dat (entries `vercel.app`, `workers.dev`)
- better-auth: Safari ITP blocks third-party cookies, so cross-domain sessions break ("auth working in Chrome but failing in Safari"); two documented fixes: reverse proxy through the frontend domain, or a shared parent domain. [V] https://better-auth.com/docs/concepts/cookies
- Our code hard-codes `sameSite: "none", secure: true` in `packages/auth/src/index.ts`, while the spec says prod is same-origin, `lax`, no CORS (spec section 3). Make it env-driven. [V, repo]
- Direct cross-origin needs: Hono `cors({ origin: <explicit web origin>, credentials: true })` before the auth route (already present, `origin` from `CORS_ORIGIN`), the same origin in `trustedOrigins` (already `[env.CORS_ORIGIN]`), `credentials: "include"` on the web client, never `*`. [V] https://better-auth.com/docs/integrations/hono . `trustedOrigins` supports wildcard patterns, but never trust all of `*.vercel.app` (anyone can host there). [V options page]
- Preview deployments get unique URLs: with direct cross-origin each must be trusted; with the proxy option they do not.

Options, best first:
1. **Proxy through Vercel (recommended for the first staging).** Next.js `rewrites()` to an external URL for `/api/auth/*`, `/rpc/*`, `/api/v1/*`, `/mcp`. The browser sees one origin, so cookies are first-party and `lax` works, no CORS, same shape as prod behind Caddy, and the OAuth callback lands on the web origin. [V] https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites (external rewrites); better-auth documents the same pattern with `vercel.json` rewrites. Set `BETTER_AUTH_URL` to the web origin. Costs: extra hop; Vercel proxy usage/limits [U]. Agent/MCP clients can call the Worker URL directly (Bearer API key needs no cookie).
2. **Shared parent domain.** Yes, it removes the problem: e.g. `staging.codesphereplatform.xyz` (web on Vercel) and `api.staging.codesphereplatform.xyz` (Worker custom domain), with `advanced.crossSubDomainCookies: { enabled: true, domain: "staging.codesphereplatform.xyz" }`, keeping `trustedOrigins`/CORS. Same-site, so `lax` is fine. [V cookies page] Requirements: an active Cloudflare zone for the Worker custom domain (cannot add a Custom Domain on a hostname with an existing CNAME or on a zone you do not own) [V] https://developers.cloudflare.com/workers/configuration/routing/custom-domains/ ; Cloudflare recommends custom domains/routes over `workers.dev` for production. [V] https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ The domain is not bought yet (team note), so this is blocked on procurement. Splitting one DNS zone between Vercel and Cloudflare via a delegated subdomain: [U].
3. Direct cross-origin with `SameSite=None; Secure` (+ Partitioned/CHIPS): works in Chromium today but Safari blocks it; not recommended. [V for Safari; CHIPS status U]

## 5. SSO redirect URIs for staging

- better-auth's default callback is `/api/auth/callback/<provider>` on `baseURL`, overridable per provider with `redirectURI`. [V] https://better-auth.com/docs/authentication/github , https://better-auth.com/docs/concepts/oauth
- With option 1 the callback host is the stable Vercel staging alias (not per-preview URLs): register `https://<staging-alias>/api/auth/callback/{github,gitlab,google}`. Preview deployments cannot sign in via SSO unless each URL is registered.
- GitHub: `redirect_uri` is optional; the callback must match exactly, or, with "wildcard matching" enabled, host/port must match and the path may be a subdirectory (a security risk, prefer exact). Apps with one callback URL created before 2026-08-03 have wildcard matching on. Create a **separate OAuth app for staging**. [V] https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitLab: the OAuth application takes a Redirect URI list [U: page fetched but text not extracted; confirm in the UI]. Use a separate application for staging.
- Google: Authorized redirect URIs are exact strings, HTTPS required except localhost, no wildcards [U: Google docs could not be fetched here]. Use a distinct OAuth client for staging.
- Rule: one OAuth app (client id/secret) per environment (local, staging, prod); store secrets via varlock/Cloudflare secrets.

## 6. Deploy

- API: `cloudflare/wrangler-action@v4` with `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}`, `accountId`, optional `workingDirectory: apps/server`; secrets via the action's `secrets:` input or `varlock-wrangler deploy`. Trigger `on: push: branches: [develop]`. [V] https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/ , https://github.com/cloudflare/wrangler-action
- Order: CI (tests, licence audit) -> `drizzle-kit migrate` against the staging DB (direct connection URL, not Hyperdrive) -> `wrangler deploy`.
- Web: Vercel Git integration, with `develop` as the production branch of the staging project (or branch-scoped env vars), with the rewrite target and public URL as Vercel env vars [U on exact project settings].
- Hyperdrive config created once: `wrangler hyperdrive create <name> --connection-string=...`, then put the id in `wrangler.jsonc`. [V Hyperdrive doc]
- Licence audit: new deps (`@varlock/cloudflare-integration`, `wrangler`) must stay permissive (CADEV art. 6).

## 7. Risks and recommendation

Risks:
1. Free plan 10 ms CPU is likely exceeded by better-auth + Zod + OpenAPI generation; the Paid plan ($5/month) is probably needed. Medium.
2. Staging stops being a faithful copy of prod (Workers + Hyperdrive + Neon vs Bun + Docker + Postgres): bugs found or hidden on one runtime only. High, inherent to the choice.
3. Cross-origin cookies break on Safari without a proxy or shared domain. High if ignored.
4. Per-request construction of `auth`/`db` changes `services.ts`/`context.ts` and the Drizzle/pg lifecycle; Drizzle 1.0 RC, better-auth 1.7.5, oRPC v2 beta and orpc-mcp 0.1.x are young and untested on Workers. Medium.
5. In-memory state (rate limits, OpenAPI cache) is per-isolate. Low-medium.
6. OTel and Pino transports need Workers-safe variants. Low.
7. Domain not purchased: blocks the shared-parent-domain option and a custom Worker domain. Medium.
8. Hyperdrive Free: 100k queries/day, ~20 connections; Neon scale-to-zero adds cold latency. Low.

Recommendation: feasible; go ahead for staging under these conditions.
- Refactor the server into a runtime-agnostic app factory with two entries (Bun, Workers); `varlock-wrangler` + `nodejs_compat` + `enable_request_signal`; Hyperdrive + Neon Free; start on Workers Free for a spike and move to Paid if CPU errors (Error 1102) appear.
- Use the **Vercel rewrite proxy** (option 1) now; move to a shared parent domain only once the domain exists. Make cookie `sameSite`/`secure` and `CORS_ORIGIN` env-driven so prod stays `lax`, same-origin.
- Time-box a 1-2 hour spike in #81 (`wrangler dev` with `/`, `/rpc`, `/mcp`, one GitHub SSO round trip) before committing: this note ran no code on Workers.
- Fallback if the spike fails or fidelity matters more: deploy staging as the same Docker image on the Systalink server (a staging Caddy host is already in the spec) with web on Vercel through the same proxy rewrite.

## Not verified here

Google OAuth redirect rules, GitLab redirect field details, Neon Postgres 18 support, Drizzle 1.0 RC on Workers, orpc-mcp on a real Workers runtime, Vercel rewrite quotas.
