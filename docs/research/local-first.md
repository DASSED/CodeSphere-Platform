# Local-first options for TanStack Start + oRPC

Research ticket: [#5](https://github.com/0xdaydy/systalink-challenge/issues/5) (child of map #1). Researched 2026-10-03.

## Question and scope

Which local-first options fit a TanStack Start + oRPC (contract-first) app whose scope is **offline reading of cached content + offline drafts synced on reconnect**, with the **server staying authoritative**, for users on unstable and expensive African connections, built in about 3 weeks? Candidates: TanStack Query persistence, TanStack DB, Dexie/IndexedDB, SQLite WASM, service worker/PWA, and an offline mutation queue.

Method: primary sources only (official docs, npm registry metadata, source packages). Where a claim comes from a third party, or I could not confirm it, it is marked **[unverified]** or **[secondary]**. Bundle sizes are my own measurements (see "Method notes").

## TL;DR

- **Read cache:** persist the TanStack Query cache to IndexedDB. Smallest change, about 2 KB gzip added, and it plugs straight into `@orpc/tanstack-query`.
- **Drafts and write queue:** keep drafts in a tiny IndexedDB store (idb-keyval, or Dexie if we want indexes). Submit them through a small hand-rolled outbox that calls the normal oRPC procedure with a client-generated idempotency key. The server accepts or rejects; no merge logic.
- **Skip for the MVP:** TanStack DB (still 0.x, about 100 KB gzip, no built-in conflict resolution), SQLite WASM (OPFS, workers, about 400 KB gzip wasm, overkill), and a full service-worker offline shell (poor documented fit with Start; Background Sync is not cross-browser). Revisit the service worker as a stretch goal only.

## Findings per option

### 1. TanStack Query persistence (`persistQueryClient`)

- **How it works.** The query cache (and mutation state) is dehydrated and stored by a persister, then hydrated on startup. Two persisters ship: sync (`createSyncStoragePersister`) and async (`createAsyncStoragePersister`); any custom `Persister` works, and the docs include an IndexedDB example, noting IndexedDB is faster, larger (5 MB+) and stores native JS types. Saves are throttled to once per second. [Query: persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- **Gotchas.** `maxAge` defaults to 24 h, and `gcTime` must be >= `maxAge`, otherwise the cache is garbage-collected earlier than expected. A `buster` string discards the cache on mismatch (useful on deploy or schema change). `PersistQueryClientProvider` blocks fetching during restore and `useIsRestoring` exposes the state. [same page](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- **Offline behaviour.** Default `networkMode: 'online'` pauses fetches (`fetchStatus: 'paused'`) and retries when offline and resumes on reconnect; `offlineFirst` runs the first fetch anyway (good with HTTP/service-worker caches); `always` ignores connectivity. [Query: network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
- **Mutations.** Paused mutations can be persisted, but "only the state of mutations is persisted, as functions cannot be serialized", so after a reload you must register defaults with `queryClient.setMutationDefaults()` and call `resumePausedMutations()` once hydration has finished. Mutations do not retry by default; `scope.id` makes mutations with the same id run serially. [Query: mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- **SSR with Start.** Start's documented integration is `@tanstack/react-router-ssr-query`: create the `QueryClient` inside `getRouter()` (never at module scope), pass it through router context, and `setupRouterSsrQueryIntegration` handles provider, dehydration, hydration and streaming. That page "does not discuss query persistence". [Start + Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query), [Query SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr). Persistence is browser-only, so it has to be wired client-side only; how best to combine `PersistQueryClientProvider` with the Start integration's own provider is **[unverified]** and needs a half-day spike.
- **oRPC fit.** `@orpc/tanstack-query` gives `queryOptions`, `mutationOptions`, `infiniteOptions`, key helpers, and for SSR recommends extending the serializer (`RPCJsonSerializer`) to handle oRPC types such as `Date`. The same concern applies to the persister's serialize/deserialize (IndexedDB structured clone keeps `Date`, so storing the dehydrated object directly avoids JSON round-trips). Streamed/live queries need special care on SSR. [oRPC: TanStack Query](https://orpc.dev/docs/integrations/tanstack-query)
- **Maturity.** Query is v5; registry shows `@tanstack/react-query` 5.104.1, persist-client 5.104.1, async-storage-persister 5.104.1 (published 2026-10-02). [npm registry](https://registry.npmjs.org/@tanstack/react-query-persist-client)
- **Server-authoritative fit:** excellent. The cache is only a stale-while-revalidate copy; the server wins on the next refetch. The risk is privacy: persist only whitelisted queries (via `dehydrateOptions`) and clear the store on logout or user switch.

### 2. TanStack DB

- **What.** "The reactive client store for your API": normalized collections, differential-dataflow live queries, optimistic mutations; sources include QueryCollection (on TanStack Query), Electric, PowerSync, RxDB, TrailBase, plus local-storage and local-only collections. [TanStack DB overview](https://tanstack.com/db/latest/docs/overview), [repo](https://github.com/TanStack/db)
- **Maturity.** The repo labels it **Beta**. The registry shows `@tanstack/db` 0.11.3, `@tanstack/react-db` 0.5.3, `@tanstack/query-db-collection` 1.3.4 and `@tanstack/offline-transactions` 1.0.61 (all published 2026-10-02), so the core is still 0.x. The docs themselves say dependency arrays "will be removed in 1.0" and talk about "pre-1.0" vs "v1.0" handler behaviour, i.e. API churn is expected. [SSR guide](https://tanstack.com/db/latest/docs/guides/ssr), [QueryCollection](https://tanstack.com/db/latest/docs/collections/query-collection), [npm registry](https://registry.npmjs.org/@tanstack/db)
- **Offline.** `@tanstack/offline-transactions` provides a durable outbox: persist, apply locally, send when online, remove; FIFO sequential processing; exponential backoff with jitter; leader election across tabs (Web Locks/BroadcastChannel); IndexedDB with localStorage fallback. It sends a stable `idempotencyKey` and says "the server must treat repeated keys as one logical mutation". It has **no built-in conflict resolution**; `NonRetriableError` marks a permanent rejection and rolls back the optimistic state. Collection IDs and mutation names must stay stable across releases. [Offline transactions guide](https://tanstack.com/db/latest/docs/guides/offline-transactions), [README](https://app.unpkg.com/@tanstack/offline-transactions@1.0.56/files/README.md)
- **Persistence.** SQLite persistence (`persistedCollectionOptions`; browser adapter `@tanstack/browser-db-sqlite-persistence` on OPFS, in a worker, secure context required). Caveats: `syncMode: 'on-demand'` is incompatible with `initialRender`, schema mismatches reset synced collections, and "persisted readiness does not prove current authorization" (we would have to isolate data per user ourselves). [SQLite persistence](https://tanstack.com/db/latest/docs/guides/sqlite-persistence)
- **SSR.** Request-scoped `DbClient`, `dehydrate()`/`hydrate()`, and a Start adapter (`@tanstack/react-router-with-db`, registry 0.1.0) that streams live queries. Promising but very new. [SSR guide](https://tanstack.com/db/latest/docs/guides/ssr)
- **oRPC fit.** Possible via QueryCollection (`queryFn` calling oRPC; the `queryFn` result is treated as the complete collection state, and `onInsert/onUpdate/onDelete` handlers would call oRPC mutations). It adds a second data layer next to the Query hooks the oRPC integration already gives us.
- **Verdict.** Technically the closest to "real" local-first, but it is the highest risk for a 3-week window: 0.x API, a new mental model, extra setup for SSR and persistence, and we still write our own conflict policy.

### 3. Dexie / IndexedDB

- **What.** Dexie is an "offline-first database library" over IndexedDB with declarative schema and versioning (`db.version().stores()`, `.upgrade()`). `liveQuery`/`useLiveQuery` re-run queries when relevant data changes. [Dexie basics](https://dexie.org/docs/Tutorial/Understanding-the-basics), [liveQuery](https://dexie.org/docs/liveQuery())
- **Maturity.** Dexie 4.4.6 (2026-09-10), dexie-react-hooks 4.4.0. [npm registry](https://registry.npmjs.org/dexie)
- **Sync.** Dexie Cloud is a separate hosted service: free tier of 3 production users / 100 MB, then per seat; CRDT (Y.js) for collaborative text; self-hostable on-prem editions. Not suitable for us (server must stay our own authoritative oRPC backend). [Dexie Cloud](https://dexie.org/cloud/)
- **SSR.** IndexedDB does not exist on the server, so Dexie code must be client-only (guard in effects, or use Start's `ssr: false` / `'data-only'` per route: with `ssr: false` neither `beforeLoad`, the loader nor the component runs on the server). [Start: selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr) The Dexie docs I read do not discuss SSR **[unverified]**.
- **Fit.** Very good for **drafts** (client-owned data, naturally local). Not needed for the read cache if Query persistence is used. Lighter alternative for key-value drafts: `idb-keyval` 6.3.0 (registry; I only measured its size and did not read its docs, **[unverified]** beyond that).

### 4. SQLite WASM

- **What.** Official `@sqlite.org/sqlite-wasm` (3.53.4-build2). Persistence options: kvvfs (localStorage/sessionStorage, main thread, ~5 MB), or OPFS VFSs (`opfs`, `opfs-wl`, `opfs-sahpool`). The standard OPFS VFS needs `Cross-Origin-Embedder-Policy: require-corp` + `Cross-Origin-Opener-Policy: same-origin` (for `SharedArrayBuffer`) and a Worker; `opfs-sahpool` is faster but has no multi-tab concurrency without extra management; Safari < 17 has OPFS bugs. [SQLite WASM persistence](https://sqlite.org/wasm/doc/trunk/persistence.md)
- **Cost.** Measured: JS loader about 66 KB gzip plus a wasm binary of 869 KB raw / about 403 KB gzip.
- **Fit.** Overkill for caching Q&A lists and drafts; COOP/COEP headers also break third-party embeds/OAuth popups unless handled carefully **[unverified for our auth choice]**. Only worthwhile if we later need relational offline queries. TanStack DB's browser SQLite persistence sits on the same OPFS foundation.

### 5. Service worker / PWA

- **What it gives.** App-shell and asset caching, and installability. With Start, the framework is SSR: SPA mode produces a static `_shell.html` (prerendered root only) with documented costs: slower time to full content and weaker SEO. [Start: SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
- **Tooling fit.** `vite-plugin-pwa` (2.0.0 on the registry, peers Vite <= 8 and `workbox-build` ^7.4.1) does not list TanStack Start in its framework docs. [vite-pwa frameworks](https://vite-pwa-org.netlify.app/frameworks/), [npm registry](https://registry.npmjs.org/vite-plugin-pwa) Community approaches exist (a Feb 2026 guide with post-build Workbox generation, and `@tinloof/tanstack-wsr` 0.2.0 which renders Start routes inside a service worker) but these are **[secondary]** and I did not evaluate them.
- **Background Sync.** MDN: "Limited availability", not Baseline; Safari and Firefox have limited or no support. Workbox's Background Sync queue stores failed requests in IndexedDB and, where the API is missing, only retries when the service worker starts, with `maxRetentionTime` expiry and no retry on 4xx/5xx unless customised. We cannot depend on it. [MDN: Background Sync](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API), [Workbox background sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync)
- **Verdict.** Useful polish (offline app shell, "install"), but it is the most uncertain piece with SSR and the least necessary for "read cache + drafts" if the app was already loaded. Treat as stretch. Note: the shell must be cached for the app to even *open* offline, which is the one thing Query persistence cannot do.

### 6. Offline mutation queue (hand-rolled or library)

Three ways to get one:
1. **TanStack Query paused mutations + persister** (see 1): free, but needs `setMutationDefaults` for every queued mutation and careful resume timing.
2. **`@tanstack/offline-transactions`** (see 2): robust (leader election, backoff, idempotency key) but tied to TanStack DB collections.
3. **Own outbox** in IndexedDB: a table of `{ id (UUID), procedure, input, createdAt, status, attempts }` flushed on `online`/app start, FIFO per draft, calling the standard oRPC client. About 100-150 lines; we control the retry and error policy.

oRPC specifics: the Client Retry plugin retries with `retry` (default 0), `retryDelay`, `shouldRetry`, `onRetry`. [oRPC: client retry](https://orpc.dev/docs/plugins/client-retry) I found **no** oRPC documentation on idempotency keys (the Dedupe plugin only collapses in-flight identical requests) [oRPC: dedupe](https://orpc.dev/docs/plugins/dedupe-requests), so idempotency must be an application-level field in the contract (a client-generated UUID that the server stores with a unique constraint). That is the only server-side change required, and it fits contract-first well.

## Cross-cutting facts

- **Storage durability.** Per MDN, default storage is best-effort and can be evicted (LRU under pressure, all-or-nothing per origin); `navigator.storage.persist()` requests persistent mode. Quotas are large (Chromium up to 60% of disk, Firefox min(10% of disk, 10 GiB), localStorage only 5 MiB). Safari additionally deletes script-writable storage after 7 days without user interaction. [MDN: quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) WebKit states home-screen web apps have their own counter and should not have data deleted. [WebKit blog (2020)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) Consequence: drafts are valuable user work, so call `navigator.storage.persist()`, show "saved on this device" status, and never treat local data as the only copy after a successful sync.
- **Auth/privacy.** Whatever we persist survives logout unless cleared; key the stores by user id and wipe on logout (TanStack DB docs make the same point about persisted data).

## Conflict resolution complexity for our domain

The MVP write paths are mostly *create-only or idempotent*: new question, new answer, vote (set/unset), accept answer, follow tag. For these, "conflict" reduces to server validation (permissions, closed question, duplicate), answered with a typed oRPC error and surfaced in the draft's UI ("rejected: reason"). Only *editing an existing post* can truly conflict; handle it with an `updatedAt`/version precondition and a 409-style typed error, keeping the local draft for the user to re-apply. No CRDT or merge logic is justified. This matches the server-authoritative model: local state is a proposal, never the truth.

## Comparison

Effort = rough developer-days for our scope (cache + drafts + sync), my estimate, not sourced.

| Option | Maturity (registry/docs) | Added size (my measurement, gzip) | SSR compatibility | Conflict-resolution complexity | Server-authoritative fit | Effort |
|---|---|---|---|---|---|---|
| Query persistence (IndexedDB) | v5, stable (5.104.1) | ~2.3 KB (persist add-on) on top of ~7 KB Query core | Client-only wiring next to Start's Query integration; combo **[unverified]**, spike needed | None (refetch wins) | Excellent | 1-2 d |
| TanStack DB (+ offline-transactions) | Beta, 0.x core (0.11.3), churn expected | ~103 KB (~112 KB with offline) | Documented (`DbClient`, Start adapter 0.1.0) but new | Low built-in: idempotency + rollback only, no merge | Good, but second data layer | 6-10 d, high risk |
| Dexie / IndexedDB (idb-keyval) | Mature (Dexie 4.4.6) | Dexie ~33 KB; idb-keyval ~1 KB | Client-only | Whatever we write | Good for drafts | 1-2 d (drafts) |
| SQLite WASM | Mature engine; browser persistence needs OPFS/workers/COOP-COEP | JS ~66 KB + wasm ~403 KB | Client-only, header constraints | Whatever we write | Neutral | 5+ d, no real benefit |
| Service worker / PWA shell | Standard APIs; Start tooling not first-class **[unverified]**; Background Sync limited | ~2.3 KB (workbox-window) + SW script | Awkward with SSR; SPA mode possible | n/a | Neutral | 2-4 d, risky |
| Own mutation queue (outbox) | Custom, small | ~0 (a few KB of our code) | Client-only | Idempotency key + typed rejection | Excellent | 2-3 d |

## Recommendation

1. **Cache for reading (week 1):** `PersistQueryClientProvider` with an async IndexedDB persister (custom `Persister`, `idb-keyval`), `maxAge` about 7 days with `gcTime >= maxAge`, a `buster` tied to the app/contract version, `dehydrateOptions.shouldDehydrateQuery` whitelisting only feed, question and answer reads, and a wipe on logout. Mount it client-side only; spike its coexistence with `setupRouterSsrQueryIntegration` first.
2. **Drafts and queued writes (weeks 1-2):** drafts in IndexedDB (`idb-keyval`; move to Dexie only if we need indexed queries or live lists). A small outbox flushes on `online`/focus/app start through the existing oRPC client, one UUID `idempotencyKey` per submission added to the contract inputs, server-side unique constraint, typed errors for rejections. Ask for `navigator.storage.persist()`.
3. **Optionally (week 3, stretch):** minimal service worker caching the app shell and static assets so the app opens offline; keep Background Sync out of the critical path.
4. **Explicitly deferred:** TanStack DB (revisit once it is 1.0), SQLite WASM, Dexie Cloud or any third-party sync engine.

Decisions to feed back to the map: offline scope = persisted query cache + local drafts + outbox; contract must include an idempotency field on create-type procedures and a version precondition on edits; auth logout must clear local stores.

## Unverified items and open questions

- Coexistence of `PersistQueryClientProvider` with `@tanstack/react-router-ssr-query` in Start (docs do not cover it): needs a spike.
- Whether `vite-plugin-pwa` 2.0 works with Start's build output; only secondary (community) sources found.
- TanStack DB page contents came through a summarising fetcher; the version numbers come from the npm registry, not the docs. The repo's "Beta" label is from the GitHub README. The GitHub releases page could not be read reliably, so I made no claims about release cadence.
- Dexie docs: SSR behaviour not stated in the pages I read.
- Safari 7-day eviction details are from a 2020 WebKit post and MDN; current WebKit behaviour was not re-verified.
- COOP/COEP interaction with our auth flow (OAuth popups, third-party embeds) not checked, because the auth choice (ticket on auth) is not yet decided.
- Effort estimates are mine.

## Method notes

- Registry metadata fetched with `npm view` on 2026-10-03 (versions and publish dates quoted above).
- Sizes: `esbuild` bundle, minified, ESM, browser, `react`/`react-dom` external, then gzip -9, importing only the named exports in a throwaway project. They are naive (not an app build with route splitting or tree-shaking of unused exports) and indicate order of magnitude only. Query core was measured with only `QueryClient` imported, so the hooks add more. TanStack DB's figure likely over-includes because of limited tree shaking.
- Not covered: Electric/PowerSync/RxDB/PGlite sync engines (they require a replication layer on our backend and conflict with contract-first oRPC as the single write path), CRDT libraries, push notifications.
