# oRPC contract-first: contract, typed errors, middleware, pagination, TanStack, OpenAPI, MCP

Research ticket: [#4](https://github.com/0xdaydy/systalink-challenge/issues/4) (child of map #1). Researched 2026-10-03.
Sources are primary only: the oRPC repository (`middleapi/orpc`, formerly `unnoq/orpc`) at pinned commits/tags, its docs (which live in `apps/content/docs` in that repo), and first-party package source. Every excerpt below comes from those files, and the code in section 10 was additionally compiled and run (see "Verification").

## 0. Read this first: two oRPC lines exist

| | v1 (stable) | v2 (beta) |
|---|---|---|
| npm dist-tag | `latest` = `1.15.4` (published 2026-09-23) | `beta` = `2.0.0-beta.41` (published 2026-10-01) |
| Docs site | `v1.orpc.dev` (docs on the `1.x` branch, tag `v1.15.4`) | `orpc.dev` (the `main` branch) |
| Install | `npm i @orpc/server@latest ...` | `npm i @orpc/server@beta ...` |

Evidence: `npm view @orpc/server dist-tags` returned `latest: 1.15.4, beta: 2.0.0-beta.41`; `apps/content/blume.config.ts` on `main` links `https://v1.orpc.dev` as "V1 docs"; the getting-started page at `orpc.dev` tells you to install `@orpc/server@beta @orpc/client@beta`.

Why it matters for this project:

- Better-T-Stack (the mandated bootstrap) scaffolds oRPC `^1.15.0` (`packages/template-generator/src/utils/add-deps.ts`, repo `AmanVarshney01/create-better-t-stack`, commit `773516e`). So the generated project is on **v1**.
- The only MCP adapter found (`orpc-mcp`) requires **v2 beta** (`@orpc/*` `^2.0.0-beta.16` as peer deps).
- v2 has breaking API changes that touch exactly the surface we care about (errors, routing/OpenAPI metadata, client typing). The official migration guide says v1 and v2 clients/servers cannot talk to each other on the wire.

Excerpts below are given for **v1.15.4** unless labelled "v2". Section 9 lists the differences.

## 1. Contract-first: `oc` and `implement`

### Define

`oc` (from `@orpc/contract`) is a builder with `.input`, `.output`, `.errors`, `.meta`, `.route` and, on routers, `.prefix`, `.tag`, `.router`. A contract router is a plain nested object. Source: `contract-first/define-contract.md` (v1.15.4):

```ts
import { oc } from '@orpc/contract'

export const listPlanetContract = oc
  .input(z.object({
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.number().int().min(0).default(0),
  }))
  .output(z.array(PlanetSchema))

export const contract = {
  planet: { list: listPlanetContract, find: findPlanetContract, create: createPlanetContract },
}
```

Notes from the docs and the v2 contract page (`contract/procedure.mdx`):

- Every chain method is optional. A contract has no `.handler`.
- "If you want the client to infer the output type correctly, define `.output`. Otherwise, the output type will be `unknown`." (v2 docs; same in v1 behaviour.)
- Each builder call returns a new instance, so contracts are reusable: `const pub = oc; const authed = pub.meta(requireAuthMeta)`.
- Contract files should stay free of server code so the client can import them (v2 `contract-first.mdx`: "Keep this file free of server code. That is what lets the client import it safely later.").
- Type helpers: `InferContractRouterInputs<typeof contract>` and `InferContractRouterOutputs<...>` (v1; renamed `InferRouterContractInputs/Outputs` in v2).

### Implement

`implement(contract)` returns an implementer that is a drop-in replacement for `os` but locked to the contract. Source: `contract-first/implement-contract.md` (v1.15.4) and the real playground `playgrounds/contract-first/src/orpc.ts`:

```ts
import { implement, ORPCError } from '@orpc/server'

export const pub = implement(contract)
  .$context<ORPCContext>()
  .use(dbProviderMiddleware)

export const authed = pub.use(({ context, next }) => {
  if (!context.user) throw new ORPCError('UNAUTHORIZED')
  return next({ context: { user: context.user } })
})
```

```ts
export const listPlanets = pub.planet.list.handler(async ({ input, context }) =>
  context.db.planets.list(input.limit, input.cursor))

export const router = pub.router({            // <-- essential for full contract enforcement
  planet: { list: listPlanets, /* find, create, update */ },
})
```

What the compiler enforces (docs: "`os.router` checks completeness"): wrong return shape is an error; a missing procedure or wrong key is an error. Input is validated before the handler, output is validated against `.output` at runtime.

## 2. Typed errors: `.errors()`, `ORPCError`, codes

### Primitives

`ORPCError(code, { message?, data?, status?, cause? })`. `code` is a free string, with common HTTP-style codes suggested and mapped to statuses. From `packages/client/src/error.ts` (v1.15.4), `COMMON_ORPC_ERROR_DEFS` includes: `BAD_REQUEST 400`, `UNAUTHORIZED 401`, `FORBIDDEN 403`, `NOT_FOUND 404`, `CONFLICT 409`, `UNPROCESSABLE_CONTENT 422`, `TOO_MANY_REQUESTS 429`, `INTERNAL_SERVER_ERROR 500`, `SERVICE_UNAVAILABLE 503`, etc. "Any error not defined above defaults to HTTP status `500` with the error code used as the message" (`openapi/error-handling.md`).

Typed errors are declared with `.errors({...})`, with an optional Standard Schema for `data`, an optional default `message` and (v1 only) an optional `status`. From `error-handling.md` (v1.15.4):

```ts
const base = os.errors({ // <-- common errors
  RATE_LIMITED: { data: z.object({ retryAfter: z.number() }) },
  UNAUTHORIZED: {},
})

const example = base
  .use(rateLimit)
  .errors({ NOT_FOUND: { message: 'The resource was not found' } })  // default message
  .handler(async ({ input, errors }) => { throw errors.NOT_FOUND() })
```

Rules stated by the docs:

- `message` and `data` are sent to the client. Never put secrets in them (docs use `danger` callouts).
- Mixing styles is allowed: throwing `new ORPCError('RATE_LIMITED', { data: {...} })` is treated "exactly as if you had thrown `errors.RATE_LIMITED`" when code/status/data match the definition; otherwise it is an unknown error.
- A plain `Error` becomes `INTERNAL_SERVER_ERROR`.
- Optional global restriction of codes via module augmentation (`interface Registry { ORPCErrorCode: ... }`, v2 docs).

### In contracts

`.errors` exists on the contract builder (`ContractBuilder.errors`, `packages/contract/src/builder.ts`: "Adds type-safe custom errors to the contract. The provided errors are spared-merged with any existing errors"). The playground contract uses it per procedure:

```ts
export const updatePlanet = oc
  .route({ method: 'PUT', path: '/planets/{id}' })
  .errors({ NOT_FOUND: { message: 'Planet not found', data: z.object({ id: UpdatePlanetSchema.shape.id }) } })
  .input(UpdatePlanetSchema)
  .output(PlanetSchema)
```

and the handler receives `errors`: `throw errors.NOT_FOUND({ data: { id: input.id } })`. On the client the error is narrowed in TanStack Query's `onError` via `isDefinedError(error)` and `error.data.id` is typed.

Crucially for a shared "base": `ContractBuilder.router(...)` applies the builder's accumulated error map to **every procedure** of the router (`enhanceContractRouter` in `packages/contract/src/router-utils.ts` merges `options.errorMap` into each procedure's `errorMap`). Shared errors can therefore be declared once on a base builder or on the router.

### Middleware and contract errors

An implementer-created middleware infers the contract's errors. If not every procedure defines the same errors, guard with `in` (v2 `contract/implementation.mdx`, v1 behaves the same, verified by compiling):

```ts
const ratelimit = implementer.middleware(async ({ next, errors }) => {
  if ('TOO_MANY_REQUESTS' in errors) {
    if (isRatelimitReached) throw errors.TOO_MANY_REQUESTS()
  }
  return next()
})
```

### Client side

```ts
import { isDefinedError, safe } from '@orpc/client'
const [error, data, isDefined] = await safe(doSomething({ id: '123' }))   // v1 shape
if (isDefinedError(error)) { console.log(error.data.retryAfter) }
```

`createSafeClient(client)` wraps every call in `safe`. (v2 changes the `safe` tuple, see section 9.)

### Validation errors

Input validation failure surfaces as `ORPCError('BAD_REQUEST')` with `cause instanceof ValidationError`; output failure as `INTERNAL_SERVER_ERROR` with the same cause. The docs (`advanced/validation-errors.md`) show how to remap them to a typed `INPUT_VALIDATION_FAILED` (status 422, `data: z.flattenError(...)`) with `onError` in `clientInterceptors` or as a base middleware, and how to declare that error in `.errors` so it is typed for clients. This is the documented path for form-field errors.

## 3. Middleware and context

From `context.md` and `middleware.md` (v1.15.4):

- **Initial context**: required inputs supplied by the caller/adapter, declared with `.$context<{ headers: Headers, env: {...} }>()` and passed via `handler.handle(request, { context })`.
- **Execution context**: computed by middleware and merged by `next({ context: {...} })`.
- Middleware shape: `async ({ context, next, path, errors }, input, output) => next({ context: {...} })`. It can be inline (`.use(fn)`), created with `.middleware(fn)` on a builder with `.$context<...>()` to declare dependent context, and can read the procedure `input` (`os.middleware(async ({ next }, input: number) => ...)`, `.mapInput`).
- Built-ins: `onStart`, `onSuccess`, `onError`, `onFinish`.
- **Where to attach decides ordering**: attached before `.input` (for example `implementer.planet.use(requireAuth).list`) the middleware wraps validation; attached after it runs after validation (`contract/implementation` docs). Router-level `.use` applies to every procedure (`implementer.use(requireAuth).router({...})`).
- **Dedupe gotcha**: if the same middleware is applied at router and procedure level it runs twice. v1 removed duplicates automatically for leading middleware; v2 does not. The documented guard is a context flag, for example `const db = context.db ?? await connectDb()` (`best-practices/dedupe-middleware.md`; the playground's `dbProviderMiddleware` uses it).
- Auth: the official Better Auth integration page builds an `authMiddleware` on `os.$context<{ headers: Headers }>()` that calls `auth.api.getSession({ headers })` and throws `ORPCError('UNAUTHORIZED')`. Relevant for agent tokens, since agents can be authenticated through the same headers path (an API-token check is the same shape of middleware; this specific use is our inference, not documented).

## 4. Pagination

oRPC has **no built-in pagination type or helper**. Pagination is defined by your own input/output schemas. The docs and playground use a cursor/limit input; the TanStack Query layer supplies the page plumbing.

Docs example (`contract-first/define-contract.md`): `limit: z.number().int().min(1).max(100).optional()`, `cursor: z.number().int().min(0).default(0)`. TanStack Query doc example uses `{ limit: 10, offset: pageParam }` and `getNextPageParam: lastPage => lastPage.nextPageParam`, which implies an output envelope with a next-page marker. The playground derives the next cursor from the last item: `getNextPageParam: lastPage => (lastPage.at(-1)?.id ?? -1) + 1`.

For this project (not from the docs, a pattern that compiled and ran in our smoke test, section 10): put `CursorPageInput` and a generic `page(item)` envelope `{ items, nextCursor: string | null }` in the shared base file so every list procedure (feed, questions, answers) uses the same shape. Opaque string cursors suit the "For You" feed better than offsets, but that is a design choice for the spec ticket, not an oRPC rule.

## 5. TanStack Query and TanStack Start

### TanStack Query (`integrations/tanstack-query.md`, package `@orpc/tanstack-query`)

```ts
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
export const orpc = createTanstackQueryUtils(client)   // client: contract client or router client

useQuery(orpc.planet.find.queryOptions({ input: { id: 123 } }))
useInfiniteQuery(orpc.planet.list.infiniteOptions({
  input: (pageParam: number | undefined) => ({ limit: 10, offset: pageParam }),
  initialPageParam: undefined,
  getNextPageParam: lastPage => lastPage.nextPageParam,
}))
useMutation(orpc.planet.create.mutationOptions({ onError: e => { if (isDefinedError(e)) {/* typed */} } }))
queryClient.invalidateQueries({ queryKey: orpc.planet.key() })
```

Also: `.streamedOptions` / `.liveOptions` for event iterators, `skipToken` instead of `disabled`, `createTanstackQueryUtils(client, { path: ['user'] })` to avoid key clashes (v2: `prefix`), a default-options mechanism, and an SSR hydration recipe that swaps the query-key hash and (de)hydration serialisers for oRPC's `StandardRPCJsonSerializer` so `Date`, `BigInt` etc. survive. The doc warns that hydration needs `staleTime > 0`.

The contract-first playground wires it from a contract-typed client (`playgrounds/contract-first/src/lib/orpc.ts`):

```ts
export const orpcClient: ContractRouterClient<typeof contract> = createORPCClient(rpcLink)
export const orpc = createTanstackQueryUtils(orpcClient)
```

For the offline/local-first requirement: oRPC exposes only the standard TanStack Query surface, so cache persistence and mutation queues are TanStack Query concerns (nothing oRPC-specific is documented). That belongs to the sync ticket.

### TanStack Start adapter (`adapters/tanstack-start.md`)

Server: mount a handler in a Start server route.

```ts
// src/routes/api/rpc.$.ts
export const Route = createFileRoute('/api/rpc/$')({
  server: { handlers: { ANY: async ({ request }) => {
    const { response } = await handler.handle(request, { prefix: '/api/rpc', context: {} })
    return response ?? new Response('Not Found', { status: 404 })
  } } },
})
```

"The `handler` can be any supported oRPC handler, including RPCHandler, OpenAPIHandler, or a custom handler." Client: `createIsomorphicFn()` chooses an `RPCLink` per environment (server forwards `getRequestHeaders()`). For SSR the doc recommends a **server-side client** (`createRouterClient(router, { context: async () => ({ headers: getRequestHeaders() }) })`) on the server and `createORPCClient(new RPCLink(...))` in the browser, so SSR does not make HTTP calls to itself (`best-practices/optimize-ssr.md`). Warning from the snippet: the router client is shared across requests, so only reuse-safe context belongs in static context; per-request data goes through the function form.

Implication for architecture: Start would host the `/api/rpc` and (optionally) `/api/...` OpenAPI routes, or the API stays a separate Node service (the map mandates a Node/TS backend) and Start only consumes it through `RPCLink`. Both are supported; the monorepo docs show `apps/api` implementing and `apps/web` consuming.

## 6. OpenAPI generation (and REST exposure)

From `openapi/openapi-specification.md`, `openapi-handler.md`, `routing.md`, `plugins/openapi-reference.md` (v1.15.4), and verified by running the generator on a contract:

- Spec generation works from a **contract or a router** (`OpenAPIGenerator.generate(contract, { info })`), OpenAPI 3.1.1 in v1, with a JSON-Schema converter per validation lib (`ZodToJsonSchemaConverter` from `@orpc/zod/zod4` for Zod 4, Valibot and ArkType also supported).
- Routing is in the contract: `.route({ method: 'GET', path: '/questions/{id}', successStatus, summary, tags })`; path params merge into `input`. Default is `POST` with a path derived from router keys.
- `OpenAPIHandler` serves the same router as REST (`@orpc/openapi/fetch` or `/node`), `filter` can hide procedures (for example tag `internal`).
- Typed errors from `.errors` appear in the generated spec as response schemas (confirmed: our smoke test produced `401`/`403`/`404`/`422`/`429` responses with `defined: true/false` discriminators for every procedure inheriting the base errors). Gotcha found while testing: the status comes from the code. A custom code that is not in `COMMON_ORPC_ERROR_DEFS` and has no `status` falls back to `500` in v1 (our first attempt used `RATE_LIMITED`, which the docs use as an example, and the spec showed `500`, not `429`). Use the standard `TOO_MANY_REQUESTS` code, or pass `status` (v1) or `errorStatusMap` (v2).
- `commonSchemas` registers reusable components, including an `UndefinedError` entry.
- `OpenAPIReferencePlugin` serves Scalar (or Swagger) docs at `/` and the spec at `/spec.json` from the handler (playground `main.ts` shows it with `bearerAuth`).
- `SmartCoercionPlugin` (`@orpc/json-schema`) coerces query-string strings to numbers/booleans per the schema, needed for `GET` endpoints with typed query input.
- Inverse direction exists: generate a contract from an existing OpenAPI document (`openapi-to-contract.md`).

This is the agent-native REST surface the map asks for ("OpenAPI issu du contrat"), with no extra work beyond adding `.route` metadata.

## 7. Exposure as an MCP server

Findings, in order of confidence.

1. **oRPC core has no MCP support.** A search of the v1.15.4 and `main` trees finds no MCP package or doc; the only hits are the docs site's own `ai.mcp` setting (it serves the *docs* over MCP) and an ecosystem link. The maintainer closed the proposal PR [middleapi/orpc#1604](https://github.com/middleapi/orpc/pull/1604) ("feat(mcp): @orpc/mcp") keeping it out of core; in his words: "I want to keep this as a separate package instead of merging it into core, and promote it as part of the oRPC ecosystem ... my read right now is that MCP interest is trending downward, so I don't want to commit deeper integration effort there just yet." Core MCP could be revisited "after v2 ships".
2. **A community package exists and is listed under "AI" in the official v2 ecosystem page**: [`orpc-mcp`](https://github.com/mi3lix9/orpc-mcp) (npm `orpc-mcp`, `0.1.3`, repo commit `ba535f2`, 2026-07-30; MIT). The ecosystem page states these packages "are maintained by their authors, not by the oRPC core team". Facts from its README/`package.json`:
   - Peer dependencies are `@orpc/{client,contract,json-schema,server,shared}` `^2.0.0-beta.16` — **v2 beta only**.
   - Opt-in per procedure via metadata: `os.meta(mcp.tool({ description }))`, plus `mcp.resource({ uri | uriTemplate })` and `mcp.prompt(...)`. MCP metadata is "independent of any `openapi` meta, so a single procedure can be served over REST and MCP at the same time".
   - `.input()` becomes the tool JSON Schema, `.output()` the output schema and structured content; "Thrown typed errors are reported back to the model as in-band tool errors".
   - `MCPHandler` for Fetch (`orpc-mcp/fetch`), Node (`/node`) and stdio (`/stdio`); runs through oRPC middleware, validation and context; takes the same JSON-schema converters as OpenAPI (`new MCPHandler(router, { serverInfo, converters: [new ZodToJsonSchemaConverter()] })`).
   - Auth model: authenticate before `handler.handle`, put the actor in `context`; `authorizeCatalogEntry` hides tools per caller; normal middleware stays the final boundary.
   - Declared limitations: no batching, no sessions/GET SSE channel, no `listChanged`/`subscribe`, no MRTR/elicitation/sampling, no `tasks`/`subscriptions` extensions. It serves MCP revisions `2024-10-07` through `2026-07-28`.
   - The README examples use `os`; they do not show `oc`/`implement`. That `oc.meta(mcp.tool(...))` flows through `implement(contract)` is plausible (v2 docs: contract metadata is readable by middleware/plugins once implemented) but **not demonstrated by the sources**; it needs a spike.
3. **On v1 (what Better-T-Stack generates)** there is no MCP adapter. Verified alternatives:
   - `@orpc/ai-sdk` (in the v1 monorepo, doc `integrations/ai-sdk.md`): `implementTool(contract, { execute })` turns a **contract** into a Vercel AI SDK tool (title from `AI_SDK_TOOL_META_SYMBOL`, description from `route.summary`; "requires a contract with an `input` schema"), and `createTool(procedure, { context })` does the same for a procedure. This feeds agents built with the AI SDK, it is not an MCP server.
   - The OpenAPI spec plus REST from section 6, consumable by any agent/HTTP tool.
   - A hand-written MCP server (official MCP TypeScript SDK) that calls `createRouterClient(router, { context })` per request and lists tools from the contract's input schemas. **Unverified** (our inference; not in oRPC sources). It is the fallback if we stay on v1 and want MCP.

Decision fork for the spec: (A) stay on v1.15.x, expose REST/OpenAPI first-class and write a thin MCP façade or rely on AI SDK tools; or (B) adopt v2 beta to use `orpc-mcp` directly, accepting beta churn (41 beta releases so far, breaking changes listed in section 9) and a single-maintainer MCP package with a 0.x version.

## 8. Recommended organisation of a shared contracts package

What the docs actually say (`best-practices/monorepo-setup.md`, v1.15.4): the "Contract First" layout is

```txt
apps/
├─ api/    // Import `core-contract` and implement it
├─ web/    // Import `core-contract` and set up @orpc/client here
packages/
├─ core-contract/  // Define contract with @orpc/contract
```

with the caveat "This is just a suggestion." Additional documented guidance: use TypeScript Project References (client `references` the server; packages enable `composite`) so the client can resolve types and `any` leaks are avoided; prefer linked workspace packages over alias imports inside server components. For publishing, `advanced/publish-client-to-npm.md` covers shipping a typed client.

What the docs do **not** say: there is no prescribed "base file" name or structure. The official playground (`playgrounds/contract-first/src`) shows the de-facto organisation, which maps directly onto the map's wish for a base file with common errors and schemas:

```txt
contract/
  index.ts      // assembles `contract = { auth: {...}, planet: {...}, sse }`
  planet.ts     // procedure contracts: oc.route(...).errors(...).input(...).output(...)
  auth.ts
schemas/        // shared zod schemas (planet.ts, user.ts, auth.ts), imported by contract AND server
orpc.ts         // implement(contract).$context<...>().use(...)  => `pub`, `authed`
routers/        // one file per router, handlers via pub/authed.<ns>.<proc>.handler(...)
middlewares/    // db provider etc.
```

Our proposal, built only from the documented primitives (`oc.errors`, builder reuse, `.router`, `implement`), is therefore:

```txt
packages/contracts/            (name is ours; depends on @orpc/contract + zod only, no server code)
  src/base.ts                  common errors + common schemas + `base` builder
  src/schemas/*.ts             question, answer, member, tag, hackathon ...
  src/<domain>.ts              per-domain contract objects built from `base`
  src/index.ts                 export const contract = { ... }; type helpers
apps/api/                      implement(contract); middlewares; handlers; RPCHandler + OpenAPIHandler (+ MCP)
apps/web/                      createORPCClient<RouterContractClient<typeof contract>> + tanstack-query utils
```

`base.ts` sketch (compiled and run against 1.15.4, see section 10):

```ts
export const base = oc.errors({
  UNAUTHORIZED: { message: 'Sign in required' },
  FORBIDDEN: {},
  NOT_FOUND: { message: 'Resource not found' },
  VALIDATION_FAILED: { status: 422, data: z.object({ fieldErrors: z.record(z.string(), z.array(z.string()).optional()) }) },
  TOO_MANY_REQUESTS: { data: z.object({ retryAfter: z.number() }) },
})
// every domain contract starts from `base`: base.route({...}).input(...).output(...)
```

Design trade-offs sourced from the docs:

- v2 docs tip (`error-handling.mdx`): "reserve [typesafe errors] for application-specific cases. For common errors like `UNAUTHORIZED` or `RATE_LIMITED`, the client usually already understands the meaning. Skipping explicit schemas for those errors can also reduce type complexity and improve TypeScript performance." So keep schemas only where `data` carries information (`VALIDATION_FAILED`, `TOO_MANY_REQUESTS`); plain codes can simply be thrown as `ORPCError` (and are typed `ORPCError` anyway).
- Because `base` errors propagate into every procedure and into the OpenAPI document (smoke test), a large shared error set inflates both TS work and the spec. Use a small `base` and add domain errors on the specific procedure (as the playground does for `update`).
- Contract-only package keeps the web bundle free of server code (docs: contract is "plain data plus schemas" so it "can be moved into a shared package that both sides depend on"). If a router is exported instead, use `minifyContractRouter` to strip internals (`contract-first/router-to-contract.md`).
- Dedupe the shared auth/db middleware with the context-flag pattern when it is applied at both router and procedure level.
- How Turborepo/Bun consumes the package (compiled `dist` versus TS sources, `composite` project references) is not covered by the oRPC docs beyond the references note above; decide it in the monorepo ticket.

## 9. v1 vs v2 differences that affect this design

From `apps/content/docs/migrations/from-v1.mdx` on `main` (commit `cb7715a`):

- **Wire format**: RPC serializer and error response body changed; v1 clients cannot talk to v2 servers. Deploy together.
- **Routing metadata**: `.route`, `.prefix`, `.tag`, `.$route` removed. Use `os.meta(openapi({ method, path, prefix, tags, ... }))` from `@orpc/openapi`; `@orpc/openapi/extensions/route` brings `.route` back. Prefixes now apply to every procedure.
- **Errors**: `status` is removed from `ORPCError` and `.errors`; HTTP status is a handler option (`new RPCHandler(router, { errorStatusMap: { ...COMMON_ERROR_STATUS_MAP, RATE_LIMITED: 429 } })`). The sketch above uses `status: 422` and is v1-only. New in v2: `error(code, { message, data })` factories with `instanceof` narrowing, registrable in `.errors`.
- **`safe`** returns `[error, data, definedError, isSuccess]` (third element is the typed error, not a boolean).
- **Contract typing names**: `ContractRouterClient` becomes `RouterContractClient`; `InferContractRouterInputs` becomes `InferRouterContractInputs`; `minifyContractRouter` becomes `minifyRouterContract` (old names remain as deprecated aliases).
- **Middleware**: automatic deduplication removed (guard with context flags); `.input`/`.output` can be called repeatedly and stack (object inputs merge flat).
- **Client**: `RPCLink` takes `origin` plus path `url` (`new RPCLink({ origin: 'http://localhost:3000', url: '/rpc' })`).
- **Packages**: `@orpc/react-query` etc. merged into `@orpc/tanstack-query` (`path` option becomes `prefix`, `experimental_` names dropped); `@orpc/openapi-client` merged into `@orpc/openapi`; Zod integration requires Zod v4.
- v2 `implement(contract)` additionally accepts a procedure config (`implement(contract, { disableOutputValidation: true })`).

## 10. Verification

A throwaway project (not committed; scratchpad only) using `@orpc/contract|server|client|openapi|zod|tanstack-query@1.15.4`, `zod@4.6.5`, TypeScript 7.0.2, run with Bun:

- `base.ts` (common errors + `CursorPageInput`/`page()` helpers), `contract.ts` (two procedures with `.route`, extending `base`), `server.ts` (`implement(contract).$context<{ user?: ... }>()`, handlers, `pub.router`, `createRouterClient`).
- `tsc --noEmit` passed with strict mode, including: `throw errors.NOT_FOUND()` in a handler, `pub.use(({ context, next, errors }) => { throw errors.UNAUTHORIZED() ... next({ context: { user } }) })`, a middleware guarded by `'TOO_MANY_REQUESTS' in errors`, and `context.user.id` being non-optional after the `authed` middleware.
- Run output: list returned `{ items, nextCursor: 'c2' }`; `client.question.get({ id: '9' })` threw an `ORPCError` with `code NOT_FOUND`, `status 404`, `defined true`, `message 'Resource not found'`; `isDefinedError(err)` returned `true` through `safe`; `OpenAPIGenerator` returned `openapi: 3.1.1` with paths `/questions` and `/questions/{id}` and, for each, response entries `200/401/403/404/422/429` generated from the inherited base errors.

Not run: TanStack Start integration, `RPCHandler`/`OpenAPIHandler` over HTTP, `orpc-mcp` (requires v2 beta), any offline/persistence behaviour. Those statements come from docs/playground source only.

## 11. Open questions for the spec

1. v1 stable (matches Better-T-Stack, mature, no off-the-shelf MCP) or v2 beta (MCP adapter, status-as-handler-concern, but pre-release)? This decision also fixes the shape of `base.ts` (`status` on `.errors` is v1-only).
2. Agent access: REST/OpenAPI only for the hackathon, MCP façade, or both? Is `oc.meta(mcp.tool(...))` through `implement` acceptable (needs a spike on v2)?
3. Pagination envelope and cursor type for the feed (opaque string versus id offset) and whether answers are paginated.
4. Error taxonomy in `base.ts`: which codes carry typed `data` (validation, rate limit) versus plain codes.
5. Where the API runs: inside TanStack Start server routes, or a separate Node service with Start as a pure consumer (the map says Node/TS backend). Package consumption in Turborepo/Bun (source vs build, project references) is undocumented by oRPC and must be settled in the monorepo ticket.

## Sources

Repository `middleapi/orpc` (redirected from `unnoq/orpc`):

- v1 line, tag `v1.15.4`, commit `3f83e5dff7b325d7cc5c0877f94ba2a2e8823868` (2026-09-23): `apps/content/docs/contract-first/{define-contract,implement-contract,router-to-contract}.md`, `error-handling.md`, `client/error-handling.md`, `advanced/validation-errors.md`, `context.md`, `middleware.md`, `router.md`, `best-practices/{monorepo-setup,dedupe-middleware,optimize-ssr}.md`, `adapters/tanstack-start.md`, `integrations/{tanstack-query,ai-sdk,better-auth}.md`, `openapi/{openapi-handler,openapi-specification,routing,error-handling,input-output-structure,openapi-to-contract}.md`, `openapi/plugins/{openapi-reference,smart-coercion}.md`, `ecosystem.md`; source `packages/client/src/error.ts`, `packages/contract/src/{builder,router-utils}.ts`; example `playgrounds/contract-first/src/**`. Rendered at `https://v1.orpc.dev/docs/...`.
- v2 line, `main` at commit `cb7715a985dc5d14e7a721480daa113f896c134d` (2026-10-01, package version `2.0.0-beta.41`): `apps/content/docs/{contract-first,error-handling,ecosystem}.mdx`, `contract/{procedure,router,implementation}.mdx`, `adapters/tanstack-start.mdx`, `integrations/tanstack-query.mdx`, `openapi/{routing,specification}.mdx`, `migrations/from-v1.mdx`, `apps/content/blume.config.ts`. Rendered at `https://orpc.dev/docs/...` (confirmed by fetching `https://orpc.dev/docs/getting-started`, which installs `@orpc/server@beta`).
- Maintainer decision on MCP: https://github.com/middleapi/orpc/pull/1604 (closed).
- npm registry: `npm view @orpc/server dist-tags` (2026-10-03) gives `latest 1.15.4`, `beta 2.0.0-beta.41`.

Community and tooling (first-party for their own behaviour only):

- `mi3lix9/orpc-mcp`, commit `ba535f2c792114565e2f26c7c64c3b925cdcfa35` (2026-07-30), `README.md` and `package.json` (v0.1.3). https://github.com/mi3lix9/orpc-mcp
- `AmanVarshney01/create-better-t-stack`, commit `773516e3260fcada2affab2089687bed6834dacc` (2026-10-03), `packages/template-generator/src/utils/add-deps.ts` (oRPC `^1.15.0`).
