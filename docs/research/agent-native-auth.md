# Agent-native auth: Agent as a first-class Member, API tokens, MCP server

Research for ticket #7 (child of map #1; feeds grilling ticket #13).
Researched 2026-10-03. Primary sources only; every claim carries a source tag `[S#]` (list at the end). Anything I could not verify is flagged **UNVERIFIED** or **INFERENCE**.

## TL;DR (recommendations)

1. **Model an Agent as its own `user` row** (a Member with `kind = "agent"`), owned by a human Member. Do not model agents as "a human's API key". Reason: `enableSessionForAPIKeys` turns a key into a session of the *key's owning user* [S3][S9], so if the key belongs to an agent-user, `auth.api.getSession()` already yields the agent Member, and the scaffolded oRPC context (`session` from `auth.api.getSession`) works unchanged [S14].
2. **MVP credential = better-auth API key** (`@better-auth/api-key`), owned by the agent-user, sent in the `x-api-key` header (default header name) [S2]. It gives hashing-at-rest, prefix, expiry, per-key rate limit, per-key `permissions` for free.
3. **Scopes**: store them in the key's `permissions` (`Record<string,string[]>`) and enforce them in an oRPC middleware via `auth.api.verifyApiKey({ body: { key, permissions } })`. The mock session does **not** carry the key's permissions (source-verified, see 3.2), so session-only enforcement would silently ignore scopes.
4. **Label agent content by deriving it from the author Member's `kind` at read time**, never from a client-supplied flag. Mark the `kind` field `input: false` in better-auth `additionalFields` [S6].
5. **OpenAPI**: `OpenAPIGenerator.generate(contract, ...)` works directly on a contract in oRPC v1 [S11].
6. **MCP server: do not plan on `orpc-mcp`.** The only contract-to-MCP bridge is a community package that requires **oRPC v2 beta**; oRPC core declined to ship MCP [S12]. better-t-stack scaffolds oRPC **^1.15.0** [S15]. Plan: a small hand-written bridge (~100-150 lines, **INFERENCE** on size) that walks the contract with `traverseContractProcedures`, builds MCP tools from the same JSON Schemas the OpenAPI generator produces, and executes via a server-side router client. Spec for the MCP side: [S7][S8].
7. **MCP-client auth**: the MCP spec's auth model is OAuth 2.1 with Protected Resource Metadata; auth is OPTIONAL [S7]. A static API key is not part of the spec. For the hackathon, accept the API key as `Authorization: Bearer <key>` (works for custom-header-capable clients) and keep the OAuth path (better-auth `mcp` / `oauth-provider`) as the stretch goal. Client-support claims are **UNVERIFIED** (not tested against Claude Desktop, Cursor, etc.).

## 0. Version snapshot (important for decisions)

| Component | Stable | Notes | Source |
|---|---|---|---|
| better-auth | 1.7.7 (`latest`) | `@better-auth/api-key`, `@better-auth/mcp`, `@better-auth/oauth-provider` all 1.7.7 | npm registry [S16] |
| oRPC | 1.15.4 (`latest`); 2.0.0-beta.41 (`beta`) | orpc.dev docs on `main` describe **v2 beta** (e.g. `openapi()` meta, `3.2.0` OpenAPI default, `@orpc/ratelimit`); v1 docs are on tag `v1.15.4` | npm [S16], repo [S10][S11] |
| better-t-stack | scaffolds `@orpc/* ^1.15.0` | `template-generator/src/utils/add-deps.ts` | [S15] |
| MCP spec | `2026-07-28` is published; `draft` also exists | Both fetched; auth text identical in the parts quoted | [S7][S8] |

Consequence: read orpc.dev with care. Pages on the main site can describe v2-only APIs that do not exist in the v1 scaffold. Where this matters below, I cite the `v1.15.4` tag.

## 1. Agent as a first-class Member

### 1.1 Data model (INFERENCE from the sources, aligned with `CONTEXT.md`)

`CONTEXT.md` already says: Member = human or agent; Agent is "always labelled as an agent". Mapping onto better-auth:

- One `user` row per Member. Add server-owned fields through `user.additionalFields`:
  - `kind`: `"human" | "agent"`, default `"human"`, `input: false`.
  - `ownerId`: for agents, the human Member responsible for it (nullable for humans), `input: false`.
- `additionalFields` supports `input: false` for "server-owned fields such as `role`", and `defaultValue`; the field is typed into the session [S6]:

```ts
// auth.ts (shape taken from the documented additionalFields API [S6])
export const auth = betterAuth({
  user: {
    additionalFields: {
      kind:    { type: ["human", "agent"], required: false, defaultValue: "human", input: false },
      ownerId: { type: "string",           required: false, input: false },
    },
  },
});
```

- Creating the agent-user must be a server-side act by an authenticated human (a dedicated oRPC procedure that inserts the user via the DB layer / better-auth server API, then calls `createApiKey` with `userId` = agent id). **UNVERIFIED**: which better-auth server API is the cleanest way to create a password-less user (internal adapter vs. `auth.api.createUser` from the admin plugin). Not tested; ticket #13 should decide.

### 1.2 Why not "organization" for agents

The `organization` plugin gives owner/admin/member roles, `createAccessControl`, `hasPermission`, and teams [S5]. For API keys it only governs *who may manage keys of an org* (`apiKey: ["create","read","update","delete"]` statements) [S4]. It is **not** a scope system for the key itself. Org-owned keys (`references: "organization"`) cannot create a mock session [S3][S9]. So for "agent = Member" the organization plugin is unnecessary for the MVP. Keep it as an option if "agents owned by a team" appears later.

### 1.3 Labelling agent-authored content (INFERENCE, grounded in 1.1)

- Persist only `authorId` on Question/Answer/Vote. Expose `author: { id, name, kind }` in the oRPC output schema; the UI shows the "agent" badge when `kind === "agent"`.
- Because `kind` is `input: false`, a client cannot self-declare as human or agent [S6]. Derive-at-read avoids a denormalised `isAgent` column that could drift.
- Optionally store `createdVia: "web" | "api" | "mcp"` on content if the product wants to distinguish a human using the API from an agent. Not required by `CONTEXT.md`.

## 2. Authentication options for an agent client

### 2.1 API key plugin (recommended MVP)

Install and use (docs for 1.7.x; the plugin now lives in its own package) [S1][S2]:

```ts
import { betterAuth } from "better-auth";
import { apiKey } from "@better-auth/api-key";

export const auth = betterAuth({
  plugins: [apiKey({ enableSessionForAPIKeys: true })],
});
```

Verified facts:

- Default header `x-api-key` (`apiKeyHeaders`), `defaultKeyLength` 64, optional `defaultPrefix`, hashing on unless `disableKeyHashing`, `enableMetadata` off by default [S2].
- Server-side creation accepts `userId`, `name`, `prefix`, `expiresIn` (seconds), `permissions`, `metadata`, `rateLimitEnabled`, `rateLimitTimeWindow`, `rateLimitMax`, `remaining`, `refillAmount`, `refillInterval` [S1]:

```ts
const data = await auth.api.createApiKey({
  body: {
    name: "my-agent-key",
    userId: agentUserId,
    prefix: "sl_agent_",
    expiresIn: 60 * 60 * 24 * 90,
    permissions: { questions: ["read", "create"], answers: ["create"] },
    metadata: { ownerId: humanId },
  },
});
```

- `keyExpiration` bounds: `minExpiresIn` default 1 day, `maxExpiresIn` default 365 days; `defaultExpiresIn` default `null` (never) [S2]. Set one.
- `enableSessionForAPIKeys` doc warning, verbatim: "This is generally not recommended, as it can lead to security issues if not used carefully. A leaked api key can be used to impersonate a user." [S3]. Acceptable here because the impersonated "user" is the agent-user itself.

### 2.2 Bearer plugin (not a fit for agents)

`bearer()` only lets a *session token* (obtained from `set-auth-token` after sign-in) be sent as `Authorization: Bearer`. Docs: "intended only for APIs that don't support cookies" and "Use this cautiously" [S2b]. It is for browser/mobile clients that cannot use cookies, not for long-lived machine credentials. Agents do not "sign in", so skip it.

### 2.3 Agent Auth plugin (watch, do not depend on it)

better-auth ships `@better-auth/agent-auth`: discovery at `/.well-known/agent-configuration`, agent registration, capability grants, device-authorization/CIBA approval, short-lived signed JWTs with `aud` and `jti` replay protection, and `createFromOpenAPI(spec, { baseUrl })` / an MCP adapter [S17]. The docs open with a warning: "an implementation of a standard on heavy development. It's not yet stable and may change" [S17]. Interesting conceptual fit (capabilities derived from OpenAPI, human approval of an agent), but too risky for a 4-week hackathon MVP. Note it as the likely long-term path.

### 2.4 OAuth for MCP (better-auth `mcp` and `oauth-provider`)

- `@better-auth/mcp` (needs `jwt()` and optionally `cimd`) exposes OAuth 2.1 endpoints under `/oauth2/*` and discovery at `/.well-known/oauth-protected-resource`; `requireMcpAuth(auth, handler, { resource })` verifies the bearer token (signature, issuer, audience, expiry), supports `requiredScopes` (403 `insufficient_scope` challenge) and DPoP [S18][S19]:

```ts
import { requireMcpAuth } from "@better-auth/mcp";
export const POST = requireMcpAuth(
  auth,
  (request, accessTokenClaims) => mcpServerHandler.fetch(request),
  { resource: "https://api.example.com/mcp", requiredScopes: ["questions:read"] },
);
```

- `@better-auth/oauth-provider` supports `client_credentials` (machine-to-machine) and is "fail closed": an administrator must assign non-empty `client_credentials_scopes` and `clientPrivileges` must approve configuring them [S20]. That is the correct OAuth analogue of "an agent with a secret and fixed scopes".
- Cost: more moving parts (JWT plugin, consent page, login page, CIMD/DCR). Worth it only if the demo must work with OAuth-only MCP clients (**UNVERIFIED** which clients).

## 3. Scopes

### 3.1 What the sources define

- API key `permissions`: `Record<string, string[]>`, set at creation, updatable server-side, checked by passing `permissions` to `verifyApiKey` [S1][S2]:

```ts
const { valid, error, key } = await auth.api.verifyApiKey({
  body: { key: apiKeyFromHeader, permissions: { questions: ["create"] } },
});
// valid: boolean; error: { message, code } | null; key: ApiKey (without the secret) | null
```

- MCP spec: servers SHOULD put required scopes in `WWW-Authenticate` (`scope="..."`); on insufficient scope respond **403** with `error="insufficient_scope"`, `scope=...`, `resource_metadata=...`; `tools/list` MAY vary by the authorization presented, "for example, returning only the tools the caller's granted scopes permit" [S7][S8].
- `orpc-mcp` has an `authorizeCatalogEntry` hook that filters tool discovery and rejects guessed names, and states that ordinary oRPC middleware must remain "the final authorization boundary" [S12].

### 3.2 Gotcha: the mock session does not carry permissions (source-verified)

In `packages/api-key/src/index.ts` (main branch), the before-hook builds `session = { user, session: { id: apiKey.id, token: key, userId, ..., expiresAt } }` and assigns it to `ctx.context.session`. No permissions field is copied [S9]. So with `enableSessionForAPIKeys` alone, `context.session` tells you *who*, not *what the key may do*. **Note**: this is the `main` branch; the published 1.7.7 tarball was not diffed (**UNVERIFIED** for 1.7.7 exactly).

### 3.3 Proposed scope scheme (INFERENCE)

Use resource-action pairs aligned with contract procedures, e.g. `questions: ["read","create"]`, `answers: ["create"]`, `votes: ["create"]`, `feed: ["read"]`, `hackathons: ["read"]`. Put the required permission in the contract's `.meta(...)` per procedure (oRPC v1 contract builders have `$meta(initialMeta)` for the typed default and `.meta(...)`; v1 middleware options expose the `procedure`, per `packages/contract/src/builder.ts` and `packages/server/src/middleware.ts` at tag v1.15.4 [S11d]; the main-branch page [S11b] describes the v2 wording) and have one middleware read it and call `verifyApiKey`. This single annotation can also drive MCP tool visibility (3.1) and OpenAPI `security` docs.

```ts
// sketch (INFERENCE): meta carries the required permission, middleware enforces it
const create = oc.meta({ permission: { questions: ["create"] } }) /* ... */;
const requirePermission = base.middleware(async ({ context, procedure, next }) => {
  const required = procedure["~orpc"].meta.permission;           // v1 contract def shape: UNVERIFIED in detail
  if (required && context.apiKey) {
    const r = await auth.api.verifyApiKey({ body: { key: context.apiKey, permissions: required } });
    if (!r.valid) throw new ORPCError("FORBIDDEN");
  }
  return next();
});
```

Human sessions (cookie) bypass key scopes and use the normal Member rules; agent-users are restricted by their key's permissions. Whether agents may also *accept* answers (author-only action, so naturally restricted to their own questions) is a product decision for #13.

## 4. Rate limiting

Three independent layers:

1. **Per API key (better-auth)**: options `rateLimit.enabled` (default true), `timeWindow`, `maxRequests`; defaults from the schema factory are **10 requests per 24 h** [S2][S9]. That default is far too low for an agent; set explicit values per key (`rateLimitTimeWindow`, `rateLimitMax`) or per config. Counting happens when the key is validated; with `enableSessionForAPIKeys` it is counted once per request, but manually calling `verifyApiKey` *and* getSession would double count [S3]. **Discrepancy**: the docs call the algorithm a "sliding window" [S2], but `evaluateRateLimit` implements start/reset/increment/deny against `lastRequest` and `timeWindow`, i.e. a window that resets once `now - lastRequest > timeWindow` [S9b]. Treat it as an approximate fixed-style window and do not rely on exact semantics.
2. **Per route/user in oRPC**: `@orpc/ratelimit` (v2 package name) / `@orpc/experimental-ratelimit` (v1.15.4 docs) with Memory, Redis, Upstash, Cloudflare adapters; memory adapter uses a sliding window log [S11c]. Good for tighter limits on writes (post a question) keyed by Member id.
3. **MCP spec**: servers "MUST ... Rate limit tool invocations" [S7b]. Layers 1 and 2 satisfy this if applied to the `/mcp` route too.

Also relevant to anti-abuse: the MCP tools spec requires input validation, access controls and output sanitisation on servers [S7b]. oRPC contracts already validate inputs.

## 5. Contract to OpenAPI (verified, v1)

From the v1.15.4 docs [S11]:

```ts
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4' // or '@orpc/zod' for zod v3

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})
const spec = await generator.generate(contract, {          // a contract OR a router
  info: { title: 'Pan-African Dev Exchange', version: '0.1.0' },
  servers: [{ url: 'https://api.example.com' }],
  filter: ({ contract }) => !contract['~orpc'].route.tags?.includes('internal'),
})
```

- Works from a contract directly ("You can generate specifications from either a Router or a Contract") [S11].
- Per-operation metadata via `.route({ operationId, summary, description, tags, ... })` [S11].
- `filter` can exclude internal procedures; expose a `GET /openapi.json` route in the API.
- v2 beta changes the surface (`generate(router, { version: '3.2.0', base: { info... } })`, `openapi()` meta) [S10]; do not copy v2 snippets into a v1 project.
- To serve the REST surface itself, `OpenAPIHandler` with `context` as a function receiving the request (`context: async () => ({ session: ... })`) [S10b]. The scaffold's `createContext` already builds `session` from `auth.api.getSession({ headers })` [S14]; with `enableSessionForAPIKeys` an `x-api-key` header makes the same call return the agent's session (the hook runs before any endpoint, matcher keyed on the header) [S9].

## 6. Contract to MCP server

### 6.1 State of the ecosystem (verified)

- oRPC core has **no MCP integration**. The docs index has none, and the ecosystem page lists `mi3lix9/orpc-mcp` under "AI" [S12a]. The package README: "community package, not part of oRPC core. It was proposed in middleapi/orpc#1604; the maintainer opted to keep MCP out of core" [S12].
- `orpc-mcp` 0.1.3: MIT, last push 2026-07-30, ~14 stars; peers `@orpc/* ^2.0.0-beta.16` [S12][S16]. **Incompatible with the scaffolded oRPC v1.** Also: opt-in per procedure via `mcp.tool({...})` meta, tool name defaults to router path joined by `_`, outputs `structuredContent` from `.output()`, typed errors returned as in-band tool errors, no sessions/SSE/elicitation [S12].
- Closest first-party precedent: `@orpc/ai-sdk` converts procedure *contracts* into AI SDK tools (`aiSdkTool` meta + `implementToolFactory`) [S10c], i.e. the pattern "tool = contract + metadata" is endorsed, just not for MCP.

### 6.2 Options

| Option | Fits v1 scaffold | Effort | Risk |
|---|---|---|---|
| A. `orpc-mcp` | No (needs v2 beta) | Low if upgraded | Beta oRPC across the whole stack, 0.1.x community package |
| B. Hand-written bridge on v1 | Yes | Medium | We own it; small surface |
| C. Official MCP SDK + OpenAPI-derived tools | Yes | Medium | Generic; loses typed errors |
| D. better-auth `agent-auth` MCP adapter | Yes | Low | Unstable standard [S17] |

**Recommendation: B**, reusing pieces that exist in v1.

### 6.3 Sketch for B (INFERENCE; not compiled or run)

Ingredients verified present in oRPC v1.15.4:

- `traverseContractProcedures` / `resolveContractProcedures` exported from `@orpc/server` (used internally by the OpenAPI generator to enumerate procedures) [S11d].
- `createRouterClient(router, { context })` for in-process calls with initial context [S11e].
- The OpenAPI generator already converts each procedure's input/output to JSON Schema [S11], so tool `inputSchema` can come from the generated spec's `requestBody`/`parameters` (merge into one object schema, as Better Auth's own OpenAPI adapter does: "Path, query, and header parameters plus the JSON request body are merged into a single input schema" [S17]).

MCP side requirements from the spec [S8]:

- Tool `name`: 1-128 chars, `[A-Za-z0-9_.-]`, unique per server; `inputSchema` must be a JSON Schema object (no-param tools: `{"type":"object","additionalProperties":false}`).
- Errors: protocol errors (unknown tool, malformed request) as JSON-RPC errors; business/validation errors as a result with `isError: true` so the model can retry.
- `outputSchema` + `structuredContent` (and also a serialised JSON `TextContent` block for compatibility).
- Annotations (`readOnlyHint` etc.) are untrusted by clients unless the server is trusted; set them from HTTP method (GET = read-only) as a convention (**INFERENCE**).
- Transport: Streamable HTTP, one `POST /mcp` route in the same server; `Authorization: Bearer` on every request, never in the query string [S7].

```ts
// pseudo-code (INFERENCE)
const tools = [];
await traverseContractProcedures({ router: contract, path: [] }, ({ contract, path }) => {
  const op = spec.paths[...]  // or build schema from contract['~orpc'].inputSchema via the converter
  tools.push({ name: path.join('_'), description: contract['~orpc'].route.summary,
               inputSchema: mergedInputSchema(op), annotations: { readOnlyHint: method === 'GET' } });
});
// tools/call -> client = createRouterClient(router, { context: await ctxFromRequest(req) })
//   then call client[...path](args); map ORPCError -> { isError: true, content: [{type:'text', text}] }
```

The `context` for each call is built from the *same* request-auth function as the REST/RPC handlers (API key -> agent session + permissions), so there is one authorization path for web, REST and MCP. Every tool call runs through the normal oRPC middleware (validation, scope check, rate limit).

### 6.4 If Option A is chosen later

Mount `MCPHandler` next to `RPCHandler`/`OpenAPIHandler` on the same router, gate with `authorizeCatalogEntry`, and enable `enableDnsRebindingProtection` with `allowedOrigins`/`allowedHosts` [S12]. All of that requires `@orpc/*@beta`.

## 7. Authenticating an MCP client: what the spec actually says

Facts from the MCP authorization section [S7] (`2026-07-28`; `draft` text identical for these points [S8]):

- Authorization is **OPTIONAL**. HTTP transports SHOULD follow the spec; STDIO SHOULD NOT and "instead retrieve credentials from the environment".
- MCP server = OAuth 2.1 **resource server**; MCP client = OAuth 2.1 client; authorization server may be co-hosted.
- Servers **MUST** implement OAuth 2.0 Protected Resource Metadata (RFC 9728); clients MUST use it for authorization-server discovery. Unauthenticated request gets `401` with `WWW-Authenticate: Bearer resource_metadata="..."` (and `scope`).
- Client registration: Client ID Metadata Documents SHOULD be supported; Dynamic Client Registration is now "deprecated and retained for backwards compatibility"; pre-registration is allowed.
- Clients MUST send RFC 8707 `resource` in authorization and token requests; servers MUST validate the token audience is themselves and "MUST NOT accept or transit any other tokens" (no token passthrough).
- Tokens only in `Authorization: Bearer`, on every request, never in the query string. Invalid/expired token: `401`. Insufficient scope: `403` + `insufficient_scope`.
- Machine clients: the step-up text distinguishes "clients acting on their own behalf (`client_credentials` clients)". The `client_credentials` grant has a separate **Draft** extension in `modelcontextprotocol/ext-auth`; the only **Stable** extension is Enterprise-Managed Authorization [S7c].

Implications for us:

- A static API key in `Authorization: Bearer` is **outside the normative flow** (the spec has no concept of non-OAuth bearer secrets). It works technically for any client that lets the user configure a header or env var (and trivially for STDIO, where the spec says to use environment credentials). Whether specific mainstream clients let you set the header is **UNVERIFIED**.
- If we implement OAuth, `@better-auth/mcp` + `requireMcpAuth` covers resource-server duties (metadata, 401/403 challenges, audience, scopes, DPoP) [S18][S19].
- Keep the audience rule in mind even for the API-key path: the MCP route must accept only credentials minted for this platform, and the MCP server must not forward the caller's key to any upstream.

## 8. Putting it together (reference flow, INFERENCE)

1. A human Member opens "Create agent": server creates `user{kind:'agent', ownerId}` and `createApiKey({ userId: agent.id, permissions, expiresIn, rateLimitMax, rateLimitTimeWindow, prefix })`. The secret is shown once.
2. Agent calls REST/OpenAPI or MCP with `x-api-key` / `Authorization: Bearer`.
3. A single context builder resolves the session (`auth.api.getSession`, API-key hook active) and, if the credential is a key, remembers the raw key for the scope middleware.
4. Procedure middleware: `requireSession` (as in oRPC's Better Auth integration [S13]) -> `requirePermission(meta.permission)` -> oRPC rate limit -> handler.
5. Output carries `author.kind`; UI shows the agent badge.
6. Revocation: delete/disable the key (immediate); the agent-user can also be banned/removed by its owner.

## 9. Open questions for #13 (grilling)

- Who may create an agent: any verified human, or only GitHub-linked humans? Max agents per human?
- Can an agent be *invited to answer* by a human, or does it act fully autonomously? Can it vote, and do its votes count toward reputation?
- Key lifetime/rotation policy and default limits (e.g. 600 req/h reads, 30 writes/h).
- MCP: API-key only for the demo, or also OAuth? (Decide after testing with the target MCP clients.)
- oRPC v1 (scaffold) vs v2 beta: staying on v1 means writing the MCP bridge ourselves (Option B).
- Is `@better-auth/agent-auth` worth a spike despite its stability warning?

## 10. Unverified / not tested

- No code was compiled or run; all snippets are from docs/source or marked INFERENCE.
- Which mainstream MCP clients support static `Authorization` headers (and which are OAuth-only).
- `permissions` behaviour in published `@better-auth/api-key@1.7.7` vs the `main` branch source read here.
- How to create a password-less agent user most cleanly in better-auth.
- That `verifyApiKey` can be called with the same key that already triggered the session hook without double counting (docs only warn about the double increment case [S3]; a single-call design should use one or the other).
- Docs pages for better-auth/oRPC were partly read through a fetch tool that summarises HTML; code excerpts were cross-checked against repository sources (`.mdx`/`.ts`) where marked [S9]-[S13], [S17]-[S20].

## Sources

Fetched 2026-10-03.

- [S1] better-auth, API Key plugin: https://www.better-auth.com/docs/plugins/api-key (and `docs/content/docs/plugins/api-key/index.mdx` in https://github.com/better-auth/better-auth)
- [S2] better-auth, API Key reference/options: https://www.better-auth.com/docs/plugins/api-key/reference
- [S2b] better-auth, Bearer plugin: https://www.better-auth.com/docs/plugins/bearer
- [S3] better-auth, API Key advanced ("Sessions from API keys", rate limiting, multiple configurations, org keys): https://www.better-auth.com/docs/plugins/api-key/advanced
- [S4] better-auth, org-owned API keys and `apiKey` permission statements: same page as [S3] (`docs/content/docs/plugins/api-key/advanced.mdx`)
- [S5] better-auth, Organization plugin: https://www.better-auth.com/docs/plugins/organization
- [S6] better-auth, `user.additionalFields`: `docs/content/docs/concepts/database.mdx` in https://github.com/better-auth/better-auth
- [S7] MCP specification 2026-07-28, Authorization: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- [S7b] MCP specification 2026-07-28, Tools (Security Considerations): https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- [S7c] MCP authorization extensions: https://github.com/modelcontextprotocol/ext-auth
- [S8] MCP specification (draft), Authorization: https://modelcontextprotocol.io/specification/draft/basic/authorization
- [S9] better-auth source, `packages/api-key/src/index.ts` (session mocking hook, default rate-limit schema): https://github.com/better-auth/better-auth/blob/main/packages/api-key/src/index.ts
- [S9b] better-auth source, `packages/api-key/src/rate-limit.ts`: https://github.com/better-auth/better-auth/blob/main/packages/api-key/src/rate-limit.ts
- [S10] oRPC docs (main = v2 beta), OpenAPI specification: https://orpc.dev/docs/openapi/openapi-specification
- [S10b] oRPC docs, OpenAPIHandler: https://orpc.dev/docs/openapi/openapi-handler
- [S10c] oRPC docs, AI SDK integration (`apps/content/docs/integrations/ai-sdk.mdx`): https://github.com/middleapi/orpc
- [S11] oRPC v1.15.4 docs, OpenAPI Specification: https://github.com/middleapi/orpc/blob/v1.15.4/apps/content/docs/openapi/openapi-specification.md
- [S11b] oRPC docs, Define contract (`.meta`, `.errors`): https://orpc.dev/docs/contract-first/define-contract
- [S11c] oRPC v1.15.4 docs, Rate Limit: https://github.com/middleapi/orpc/blob/v1.15.4/apps/content/docs/helpers/ratelimit.md
- [S11d] oRPC v1.15.4 source, `packages/server/src/router-utils.ts` (`traverseContractProcedures`, `resolveContractProcedures`)
- [S11e] oRPC v1.15.4 docs, Server-Side Clients (`createRouterClient`): https://github.com/middleapi/orpc/blob/v1.15.4/apps/content/docs/client/server-side.md
- [S12] `orpc-mcp` README and source: https://github.com/mi3lix9/orpc-mcp
- [S12a] oRPC ecosystem page: https://github.com/middleapi/orpc/blob/main/apps/content/docs/ecosystem.mdx
- [S13] oRPC, Better Auth integration: https://github.com/middleapi/orpc/blob/main/apps/content/docs/integrations/better-auth.mdx
- [S14] better-t-stack oRPC context template (session from `auth.api.getSession`): https://github.com/AmanVarshney01/create-better-t-stack/blob/main/packages/template-generator/templates/api/orpc/context.ts.hbs
- [S15] better-t-stack dependency pins: https://github.com/AmanVarshney01/create-better-t-stack/blob/main/packages/template-generator/src/utils/add-deps.ts ; CLI options: https://www.better-t-stack.dev/docs/cli/options
- [S16] npm registry (`npm view` dist-tags/versions for `@orpc/server`, `orpc-mcp`, `better-auth`, `@better-auth/*`)
- [S17] better-auth, Agent Auth plugin: `docs/content/docs/plugins/agent-auth.mdx` in https://github.com/better-auth/better-auth
- [S18] better-auth, MCP plugin: https://www.better-auth.com/docs/plugins/mcp
- [S19] better-auth source, `packages/mcp/src/require-mcp-auth.ts`
- [S20] better-auth, OAuth Provider plugin (`client_credentials`): `docs/content/docs/plugins/oauth-provider.mdx` in https://github.com/better-auth/better-auth
