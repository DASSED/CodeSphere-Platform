# Research: what better-t-stack generates for TanStack Start + oRPC + Bun + Turborepo

Resolves ticket #2 (child of map #1). Researched 2026-10-03.

## Method and sources

All claims below come from primary sources, and most were verified empirically by running the real CLI.

| Tag | Source |
| --- | --- |
| **[CLI]** | `bunx create-better-t-stack@latest --help`, `create --help`, `add --help`, `schema` (CLI version **3.44.2**, run on Windows, Bun 1.4.0, 2026-10-03) |
| **[GEN]** | Projects actually scaffolded with the CLI into a scratch directory (`--no-install`); file lists and contents quoted below come from those outputs. Reproducible with the commands in "Reproduce" |
| **[DOCS]** | Official docs source (MDX) in the CLI repo, `apps/web/content/docs/` at `main` commit `773516e` (2026-10-03), published at <https://better-t-stack.dev/docs>: [`cli/options`](https://better-t-stack.dev/docs/cli/options), [`cli/compatibility`](https://better-t-stack.dev/docs/cli/compatibility), [`cli/agent-workflows`](https://better-t-stack.dev/docs/cli/agent-workflows), [`project-structure`](https://better-t-stack.dev/docs/project-structure), [`guides/docker`](https://better-t-stack.dev/docs/guides/docker) |
| **[REPO]** | <https://github.com/AmanVarshney01/create-better-t-stack> (templates in `packages/template-generator/templates/`, CLI in `apps/cli/`) |

Caveat: the generator's dependency versions are pinned by the CLI at generation time and move fast (for example `drizzle-orm 1.0.0-rc.4`, `zod ^4`, `typescript ^6`, `better-auth 1.7.5`, `@orpc/* ^1.15.0`). Re-run the scaffold on the day we bootstrap and do not copy versions from this note.

## TL;DR

1. The exact stack from the map is supported and validated: `--frontend tanstack-start --api orpc --runtime bun --addons turborepo` ([DOCS] compatibility table: TanStack Start supports both tRPC and oRPC).
2. The scaffold is non-interactive if and only if every prompt is answered by a flag. `--yes` takes the defaults (`tanstack-router`, `trpc`, `sqlite`) and cannot be combined with stack flags. The cleanest agent route is `create-json` or fully-flagged `create` (details below).
3. Backends: `hono`, `express`, `fastify`, `elysia` (plus `convex`, `self` = fullstack inside the web app, `none`). All four server backends get an identical `packages/api` oRPC router and differ only in `apps/server/src/index.ts`.
4. DB/ORM: sqlite, postgres, mysql with Drizzle or Prisma; mongodb with Mongoose or Prisma. Auth: Better-Auth, Clerk, or none.
5. Tailwind v4 and shadcn/ui are **provided** (the map assumed they were not): shadcn primitives live in a shared `packages/ui`. Docker and docker-compose are **provided on request** (`--db-setup docker --web-deploy docker --server-deploy docker`).
6. **Not provided:** Pino (the only logger addons are `evlog` and `axiom`), a separate contracts package, and a *contract-first* oRPC setup (the scaffold is router-first, with `os.$context<Context>()` and inline procedures).

## 1. CLI surface

### Subcommands [CLI]

`create` (default), `create-json`, `schema`, `add`, `add-json`, `history`, `builder`, `docs`, `sponsors`.

### `create` options (from `create --help`) [CLI]

| Flag | Values |
| --- | --- |
| `--template` | `mern`, `pern`, `t3`, `uniwind`, `none` |
| `--yes` | take defaults (default stack below) |
| `--yolo` | bypass validations (not recommended) |
| `--dry-run` | validate without writing files |
| `--verbose` | print the JSON result, including `reproducibleCommand` |
| `--database` | `none`, `sqlite`, `postgres`, `mysql`, `mongodb` |
| `--orm` | `drizzle`, `prisma`, `mongoose`, `none` |
| `--auth` | `better-auth`, `clerk`, `none` |
| `--payments` | `polar`, `none` |
| `--frontend` (multiple) | `tanstack-router`, `react-router`, `tanstack-start`, `next`, `nuxt`, `native-bare`, `native-uniwind`, `native-unistyles`, `svelte`, `solid`, `astro`, `none` |
| `--backend` | `hono`, `express`, `fastify`, `elysia`, `convex`, `self`, `none` |
| `--runtime` | `bun`, `node`, `workers`, `none` |
| `--api` | `trpc`, `orpc`, `none` |
| `--addons` (multiple) | `pwa`, `tauri`, `electrobun`, `starlight`, `biome`, `lefthook`, `husky`, `mcp`, `turborepo`, `nx`, `vite-plus`, `fumadocs`, `ultracite`, `oxlint`, `opentui`, `wxt`, `skills`, `evlog`, `axiom`, `none` |
| `--examples` (multiple) | `todo`, `ai`, `none` |
| `--db-setup` | `turso`, `neon`, `prisma-postgres`, `planetscale`, `mongodb-atlas`, `supabase`, `d1`, `docker`, `none` |
| `--web-deploy` / `--server-deploy` | `cloudflare`, `prisma`, `docker`, `vercel`, `none` |
| `--package-manager` | `npm`, `pnpm`, `bun` |
| `--git` / `--no-git`, `--install` / `--no-install` | booleans |
| `--directory-conflict` | `merge`, `overwrite`, `increment`, `error` |
| `--open` | editor or coding agent to launch afterwards (`claude-code`, `cursor`, ..., `none`) |
| `--render-title`, `--disable-analytics`, `--manual-db`, `--db-setup-options <json>` | misc |

### Non-interactive behavior (empirically verified) [CLI][GEN]

- `--yes` default stack (from `--yes --dry-run --verbose`): `tanstack-router` + `hono` + `bun` + `sqlite` + `drizzle` + `trpc` + `better-auth` + `turborepo`. Passing it together with any core stack flag fails: *"Cannot combine --yes with core stack configuration flags: --database, --orm, --auth, --frontend, ..."*.
- Without `--yes`, any option not given as a flag becomes an interactive prompt. In a non-TTY shell the process then hangs and exits with "unsettled top-level await". We hit this in turn for `--payments` and then `--git`. **A fully non-interactive custom run must pass every flag, including `--payments none` and `--git`/`--no-git`.** (`--git false` also works.)
- `create-json --input '<json>'`, `add-json`, and `schema --name <schema>` are the documented agent-friendly path, with a JSON payload and a machine-readable result ([DOCS] `cli/agent-workflows`). `--dry-run` works on all of them.
- `--verbose` prints a `reproducibleCommand`; the CLI also writes it to `bts.jsonc` at the project root so `add` can later extend the project ([DOCS] `bts-config`).
- `add` can add addons and **scaffold an extra workspace package** later: `add --package <name> --addons ... --project-dir ...` [CLI].

### Command for our stack [GEN]

```bash
bunx create-better-t-stack@latest systalink \
  --frontend tanstack-start \
  --backend hono --runtime bun \
  --api orpc \
  --database postgres --orm drizzle --db-setup docker \
  --auth better-auth --payments none \
  --addons turborepo biome \
  --examples none \
  --web-deploy docker --server-deploy docker \
  --package-manager bun --no-install --no-git --disable-analytics
```

This was run with equivalent flags (see "Reproduce") and succeeded for Hono, Elysia, Express, Fastify, and the `self` backend.

## 2. Backend choices

Only **one** web frontend is allowed; one web plus one native is fine [DOCS].

| `--backend` | Layout produced [GEN] | Notes |
| --- | --- | --- |
| `hono` | `apps/{server,web}` + `packages/{api,auth,config,db,ui}` | `apps/server/src/index.ts` uses Hono, `hono/logger`, `hono/cors`. oRPC `RPCHandler` at `/rpc/*` and `OpenAPIHandler` + `OpenAPIReferencePlugin` at `/api-reference`. Better-Auth at `/api/auth/*` |
| `elysia` | same layout | Elysia + `@elysiajs/cors`. Same oRPC handlers, mounted with `.all("/rpc*")`, `parse: "none"` |
| `express` | same layout | Express + `cors`, `@orpc/server/node` adapters, `toNodeHandler(auth)` |
| `fastify` | same layout | `@orpc/server/fastify` adapters. Uses `Fastify({ logger: true })`, i.e. Fastify's **built-in Pino** (not wired for our needs, but it is the only backend with Pino behind it) |
| `self` | only `apps/web` + the same `packages/*`, **no `apps/server`**; oRPC served from TanStack Start routes `apps/web/src/routes/api/rpc/$.ts` and `api/auth/$.ts` | `--runtime none`. Deploy only via `--web-deploy`; `--server-deploy` is not used [DOCS] |
| `convex` | Convex preset; forces `--api none --database none --orm none` | Out of scope for us |
| `none` | no backend; forces auth/db/orm/api/runtime to `none` | |

Constraints worth knowing [DOCS compatibility]:

- Workers runtime requires `hono` (and rules out `docker` DB setup and MongoDB). `--server-deploy docker|vercel` requires `--runtime bun|node`; `--server-deploy cloudflare` requires `--runtime workers` with Hono.
- The brief says "Node.js + TypeScript" for the backend while the map also imposes Bun. The CLI accepts `--runtime bun` or `--runtime node` for all four server backends. With `bun`, the generated server is bundled with `tsdown` and started with `bun run dist/index.mjs` (the Dockerfile uses `oven/bun:1`). Which runtime the platform targets is a decision for the architecture tickets.

## 3. Database, ORM, auth

### Database and ORM [DOCS compatibility, CLI]

| Database | ORM |
| --- | --- |
| `sqlite`, `postgres`, `mysql` | `drizzle` or `prisma` |
| `mongodb` | `mongoose` or `prisma` (MongoDB + Drizzle is rejected) |
| `none` | `none` (a database requires an ORM and vice versa) |

Hosting providers (`--db-setup`): Turso (sqlite), D1 (sqlite, Workers), Neon / Supabase / Prisma Postgres (postgres), PlanetScale (mysql/postgres), MongoDB Atlas, and `docker` (postgres, mysql, mongodb only; not sqlite or Workers).

Generated Postgres + Drizzle [GEN]: `packages/db` with `drizzle.config.ts`, `src/index.ts` (`createDb(env)` using `drizzle-orm/node-postgres`), `src/schema/auth.ts` (Better-Auth tables `user`, `session`, `account`, `verification`), `src/relations.ts`, `src/migrations/`. Scripts: `db:push`, `db:generate`, `db:migrate`, `db:studio`. Prisma generates `packages/db/prisma/` and `prisma.config.ts` instead.

### Auth [DOCS options, GEN]

- `better-auth` (the CLI default): needs a backend, and if there is a DB it needs an ORM. Generated `packages/auth` (`createAuth(env, db)` using `drizzleAdapter`, `emailAndPassword: { enabled: true }`, cookies `sameSite: none; secure; httpOnly`, no social providers and `plugins: []`). Web gets `lib/auth-client.ts`, `sign-in-form.tsx`, `sign-up-form.tsx`, `user-menu.tsx`, and a TanStack Start auth middleware plus `_auth` guarded route.
- `clerk`: works with Hono, Express, Fastify, Elysia, Convex, or `self` with Next.js/TanStack Start. Not with Nuxt, Svelte, Solid, Astro.
- `none`.
- Payments: `polar` only, and only with Better-Auth.

Mismatch to flag for the auth ticket: Better-Auth here is session-cookie auth for humans. API tokens for Agents (map requirement) are **not** scaffolded; Better-Auth's own plugins (for example API key) would have to be added by us.

## 4. Produced package layout (Hono + oRPC + Postgres/Drizzle + Better-Auth + TanStack Start + Turborepo + Biome) [GEN]

```
bts.jsonc                      # CLI metadata (keep for `add`)
package.json                   # Bun workspaces: apps/*, packages/*; dependency "catalog"
turbo.json                     # tasks: build, lint, check-types, dev, db:*; globalEnv
biome.json  bunfig.toml  tsconfig.json  README.md  .gitignore
apps/
  server/                      # Hono API (omitted with --backend self)
    src/{index,context,services,env.server}.ts
    .env.schema  tsdown.config.ts  Dockerfile (docker deploy)
  web/                         # TanStack Start (Vite 8, port 3001)
    src/{routes,components,functions,middleware,lib,utils}
    src/utils/orpc.ts          # oRPC client + TanStack Query utils
    vite.config.ts  components.json  .env.schema
packages/
  api/                         # oRPC router + procedures (@<name>/api)
  auth/                        # Better-Auth factory (@<name>/auth)
  db/                          # Drizzle schema, client, migrations (@<name>/db)
  ui/                          # shadcn/ui primitives + Tailwind globals (@<name>/ui)
  config/                      # shared tsconfig.base.json (@<name>/config)
docker-compose.yml  .dockerignore   # only with docker options
```

Key behaviors:

- Package scope is the project name (`@<project>/api`, ...). Packages export raw TypeScript (`"exports": { ".": "./src/index.ts", "./*": "./src/*.ts" }`), so there is no build step for internal packages.
- Root `package.json` scripts: `dev`, `build`, `check-types`, `dev:web`, `dev:server`, `db:push|studio|generate|migrate`, `env:generate`, `auth:generate`, `check` (biome). Turborepo only exists if we pass `--addons turborepo`.
- Env handling uses **Varlock** (`.env.schema` files, generated `src/env.ts` typed `ENV`), not raw `process.env` or t3-env. A `postinstall` hook runs `varlock codegen`.
- The web stack: TanStack Start + TanStack Router + TanStack Query SSR integration (`@tanstack/react-router-ssr-query`), TanStack Form, `@orpc/tanstack-query`, Sonner toasts, dark theme by default, devtools.
- oRPC shape (`packages/api/src/index.ts`):
  ```ts
  export const o = os.$context<Context>();
  export const publicProcedure = o;
  const requireAuth = o.middleware(async ({ context, next }) => { ... throw new ORPCError("UNAUTHORIZED") ... });
  export const protectedProcedure = publicProcedure.use(requireAuth);
  ```
  and `packages/api/src/routers/index.ts` exports `appRouter = { healthCheck, privateData }` plus `AppRouter` / `AppRouterClient` types. Context is `{ session, db }`.
- Hono server wires `RPCHandler` (`/rpc`) and `OpenAPIHandler` with `OpenAPIReferencePlugin` + `ZodToJsonSchemaConverter` (`/api-reference`). So an **OpenAPI document and reference UI already come for free** from the router. That matches the map's "OpenAPI derived from the contract" need, though derived from the router, not from a separate contract.

## 5. What it does and does NOT provide (against the map's stack)

| Map requirement | Verdict | Evidence |
| --- | --- | --- |
| Bun + Turborepo | Provided (turborepo is an addon: pass it explicitly; `nx` and `vite-plus` are mutually exclusive with it) | [GEN], [DOCS] |
| TanStack Start | Provided | [GEN] |
| Tailwind CSS | **Provided**: Tailwind v4 via `@tailwindcss/vite`, tokens in `packages/ui/src/styles/globals.css` | [GEN] |
| shadcn/ui | **Provided**: `components.json` in `packages/ui` and `apps/web` (style `base-lyra`, Base UI primitives, `registries: {}`), ~17 components (button, card, input, textarea, dropdown-menu, checkbox, label, skeleton, sonner, tooltip, empty, input-group, message, bubble, ...). Add more with `npx shadcn@latest add <names> -c packages/ui`. The `registries` map is empty, so third-party registries (shoogle.dev, shadcn registry namespaces) must be added by us in `components.json` | [GEN], [DOCS] README of generated project |
| oRPC | Provided, **router-first** | [GEN] |
| oRPC **contract-first** (`oc` contracts, `implement()`) | **Not provided**. No `@orpc/contract` dependency, no occurrence of `contract` or `implement(` in the generated tree. Procedures are defined inline with `os.$context`, and types flow from `typeof appRouter` | [GEN] (grep over generated project returned nothing) |
| Separate contracts package (shared base file with typed errors) | **Not provided**. `packages/api` is router + procedures + context. We would add `packages/contract` ourselves (the CLI's `add --package <name>` can scaffold an empty workspace package) and migrate `packages/api` to `implement(contract)` | [GEN], [CLI] `add --package` |
| Typed error handling in the contract | Not provided: only `throw new ORPCError("UNAUTHORIZED")` in the auth middleware | [GEN] |
| Pino | **Not provided.** No Pino dependency or import in any of the generated variants (Hono / Express / Elysia use `hono/logger` or `console.error`). The only logging addons are `evlog` (structured request logging, wired into the Hono server in our test, writes to FS in dev) and `axiom` (managed observability on top of evlog and Alchemy) [DOCS options]. Fastify has Pino built in via `logger: true` but we are not using Fastify. We add `pino`/`pino-http` ourselves (or choose Fastify) | [GEN] with `evlog` |
| Docker / compose | **Provided on request**: `--web-deploy docker` / `--server-deploy docker` generate `apps/*/Dockerfile` (multi-stage, `oven/bun:1`), root `.dockerignore`, `docker-compose.yml` (services `web` 3001, `server` 3000, `postgres:18` with named volume and healthchecks, `depends_on: service_healthy`, `restart: unless-stopped`). Scripts documented: `bun docker:up|build|logs|down`, `db:start|watch`. The default password is `password` unless `POSTGRES_PASSWORD` is set. Needs a reverse proxy and real secrets for the VPS [DOCS `guides/docker`]. Not combinable with sqlite or Workers | [GEN], [DOCS] |
| Node.js backend | Optional: `--runtime node` | [DOCS] |
| Better-Auth bearer / API tokens for agents | Not provided | [GEN] |
| MCP server of our own | Not provided (the `mcp` addon only installs MCP servers for the developer's agent tooling, not a server for the app) | [DOCS options] |
| Offline / local-first | Not provided (`pwa` addon is TanStack Router only and caches the app shell; not compatible with TanStack Start) | [DOCS compatibility] |
| i18n | Not provided | [GEN] |

## 6. Implications for the map (open points to decide elsewhere)

- Bootstrap command is settled; we should still decide `--db-setup docker` vs running our own compose, because the generated compose has the exact `web`, `server`, `postgres` shape needed for `docker compose up` locally.
- The contract-first constraint means a **post-scaffold refactor**: add `packages/contract` (oRPC `oc` contracts and shared error definitions), turn `packages/api` into the implementation (`implement(contract)`), and point `apps/web/src/utils/orpc.ts` at the contract type. The server wiring (`RPCHandler`, `OpenAPIHandler`) can stay as generated.
- Logging needs a Pino integration in `apps/server` (small), or accept `evlog`. Pino must be added as a dependency of the server app and ideally exposed through a shared logger in the oRPC context.
- shadcn registry usage (shoogle.dev and others) needs `registries` entries in `packages/ui/components.json` and `apps/web/components.json`.
- Generated defaults to keep in mind: dark class on `<html>`, `lang="en"` hard-coded (needs FR/EN work), title "My App", sample auth screens and `healthCheck` / `privateData` routes to remove.

## Reproduce

```bash
# help and schema
bunx create-better-t-stack@latest --help
bunx create-better-t-stack@latest create --help
bunx create-better-t-stack@latest schema

# main scaffold (Hono)
bunx create-better-t-stack@latest demo --frontend tanstack-start --backend hono --runtime bun \
  --api orpc --database postgres --orm drizzle --auth better-auth --payments none \
  --addons turborepo biome --examples none --db-setup none --web-deploy none --server-deploy none \
  --package-manager bun --no-install --git false --disable-analytics --render-title false

# docker variant: --db-setup docker --web-deploy docker --server-deploy docker
# other backends: --backend elysia | express | fastify; fullstack: --backend self --runtime none
# logging variant: --addons turborepo evlog
```

Variants scaffolded and inspected: Hono, Elysia, Express, Fastify, `self`, Hono + Docker, Hono + Prisma, Hono + SQLite, Hono + `evlog`.
Not inspected: Clerk, MySQL, MongoDB, Workers (covered only by the docs' compatibility rules).
