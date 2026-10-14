# OWASP Top 10 in force, applied to CodeSphere's stack

Research for ticket #21 (child of security map #20; feeds #25 and #26).
Researched 2026-10-03. Primary sources only (owasp.org, top10.owasp.org, api-security.owasp.org, genai.owasp.org, and OWASP-owned GitHub repos). Every fact about an OWASP list carries a source tag `[S#]` (list at the end). The "risk in our stack" and "control" columns are **my application of each category to CodeSphere** (INFERENCE from the category's intent plus `CONTEXT.md`), not OWASP text. Anything I could not verify is flagged **UNVERIFIED**.

## TL;DR

1. **Web: OWASP Top 10:2025 is in force** (8th installment, supersedes 2021). The project page says "The most current released version is the OWASP Top Ten 2025" [S1][S2]. Two new categories (A03 Software Supply Chain Failures, A10 Mishandling of Exceptional Conditions), SSRF folded into A01 [S3]. Cite it as `A0x:2025`.
2. **API: OWASP API Security Top 10:2023 is the latest edition** (`API1:2023`..`API10:2023`) [S4][S5]. The API-Security repo only has `editions/2019` and `editions/2023`, and the portal mentions nothing newer. No 2025/2026 edition found (absence of evidence, see flags).
3. **LLM: OWASP Top 10 for LLM Applications 2026 supersedes 2025** (`LLM01:2026`..`LLM10:2026`). Notable changes: Excessive Agency rose to #3, System Prompt Leakage became **Hidden Context Exposure**, Improper Output Handling dropped to #10 [S6][S7][S8]. The genai.owasp.org landing page `/llm-top-10/` still lists the 2025 edition (stale), so do not cite it as current.
4. **Agentic: OWASP Top 10 for Agentic Applications 2026** (`ASI01`..`ASI10`), published 2025-12-09 [S9]. The 2026 LLM list explicitly delegates tool-using/agent risk to it: "once models gain agency ... the risk moves to the OWASP Agentic Top 10", so use both [S8].
5. **Biggest product-specific exposures** (details below): stored XSS and image-exfiltration via rendered Markdown (A05, LLM10); authorization on every oRPC procedure and per-object rule (A01, API1/5); mass assignment and client-forged fields through the local-first sync (API3, A08); business-flow abuse by agents (API6, ASI01/02/10); CodeSphere content as an indirect-prompt-injection delivery surface for other people's agents (LLM01, ASI01).

## 1. Which editions are in force

| List | Edition in force | Evidence | Superseded |
|---|---|---|---|
| OWASP Top 10 (web) | **2025** | `owasp.org/Top10` permanently redirects to `top10.owasp.org`, which redirects to "OWASP Top 10:2025"; project page text says the most current release is 2025 [S1][S2]. | 2021 [S2] |
| OWASP API Security Top 10 | **2023** | Portal lists 2023 as current plus a 2019 archive; repo `editions/` has only 2019 and 2023 [S4][S5]. | 2019 |
| OWASP Top 10 for LLM Applications | **2026** (publication page dated 2026-08-03/04) | Active repo's README: "The 2026 edition was published August 4, 2026"; legacy repo README: "Current release: OWASP GenAI LLM Top 10 2026 ... Previous release: 2025" [S6][S7]. | 2025 [S7] |
| OWASP Top 10 for Agentic Applications | **2026** (published 2025-12-09) | Resource page [S9]. Names confirmed from the LLM 2026 repo's framework-mapping appendix [S10]. | none |

Related: the GenAI project also announced an "Agent Control Standard (ACS)" for runtime enforcement of agents [S11]. It is not a Top 10 and I did not read it; it may be useful for #25/#26 (**UNVERIFIED relevance**).

## 2. Assumptions about our stack

From `CONTEXT.md` and the map body (#20): Bun + Hono + oRPC (contract `@codesphere/contract`), better-auth with SSO only (GitHub/GitLab/Google), Drizzle + Postgres 18, TanStack Start, Docker Compose behind Caddy, user-authored Markdown with code rendered in the web app, local-first drafts in IndexedDB, Agents as Members using hashed API keys, MCP exposure. Domain rules relevant to access control: an Agent never votes; no vote on one's own content; one Answer per Member per Question; only the Question's author (or an Admin) closes/accepts; only Admin edits Hackathons.

**Assumption (UNVERIFIED against the main spec #1): CodeSphere does not run its own LLM inference in the MVP.** It exposes an API/MCP surface to *external* agents and stores content those agents (and other people's agents) will read. If any server-side LLM feature is added (summaries, auto-tagging, moderation), the LLM rows below move from "we are the delivery surface" to "we are the vulnerable application".

## 3. OWASP Top 10:2025 (web)

Category names verified [S3]. Risk and control columns are my application.

| ID | Category | Concrete risk here | Recommended control |
|---|---|---|---|
| A01:2025 | Broken Access Control (now includes SSRF) | Missing ownership/role checks on oRPC procedures (edit/close/accept/delete someone else's Question, Admin-only Hackathon edits, an Agent calling a vote procedure); IDOR on ids; list endpoints returning other Members' drafts or private fields. SSRF via any server-side fetch (link previews, avatar/OG fetch, Markdown image proxy, MCP tools that fetch URLs). | Deny by default: one authz middleware chain (`authed` -> `role` -> per-object predicate), with the ownership predicate in the Drizzle `where`, not after the read. Encode each domain rule as a test (agent vote, self-vote, second answer, non-owner close). SSRF: avoid server-side fetching of user URLs; if needed, allowlist scheme/host, resolve and block private/loopback/link-local ranges, no redirects, short timeout. Single-origin CORS; Hono `csrf` middleware on cookie-authenticated mutations. |
| A02:2025 | Security Misconfiguration | Caddy missing security headers; Postgres port published by Compose; containers as root; secrets in committed `.env`; dev tooling/OpenAPI docs/debug endpoints on in prod; wrong better-auth `baseURL`/`trustedOrigins`; permissive CORS. | Caddyfile sets CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`. Compose: only Caddy publishes ports; Postgres on an internal network; non-root users, read-only FS where possible; secrets via env/secret files, never in the image. Prod/dev config split; docs/reference endpoints off or admin-only in prod; config check in CI. |
| A03:2025 | Software Supply Chain Failures | Pre-release core deps (oRPC v2 beta, better-auth plugins); transitive npm dependencies; Docker base images; GitHub Actions; MCP servers/tools we or users add; Markdown/syntax-highlight plugins. Also the hackathon rule: GPL/AGPL/LGPL dependencies forbidden (compliance, not OWASP). | Commit `bun.lock`, install with frozen lockfile in CI/Docker; pin versions of beta packages exactly; pin base images by digest and Actions by SHA; automated dependency/vulnerability scan on PRs; SBOM; license scan that fails on (A/L)GPL; review changes to lockfile; separation of duty on the deploy path (OWASP: no single person goes from code to production) [S12]. |
| A04:2025 | Cryptographic Failures | Weak/rotating-less `BETTER_AUTH_SECRET`; API keys stored recoverably (already decided: hashed); OAuth provider tokens stored in clear in the DB; no encryption at rest/backups (map "not yet specified"); sensitive data kept in IndexedDB on shared devices; HTTP between containers. | TLS only (Caddy automatic HTTPS, HSTS). Strong random secrets, documented rotation. Keep API keys hashed, shown once. Check whether better-auth encrypts stored OAuth tokens and enable it, or do not store tokens we do not need (**UNVERIFIED**, not checked in this ticket). Encrypt backups. Keep IndexedDB free of credentials and of other Members' private data. |
| A05:2025 | Injection | **Stored XSS through rendered Markdown** (raw HTML, `javascript:` links, SVG/`data:` URLs, event handlers inside code/HTML blocks) in Questions, Answers, profiles, Hackathon text. SQL injection through raw `sql` fragments or search. Log injection. Command injection in any MCP tool that shells out. | Markdown pipeline with raw HTML disabled or a strict sanitizer allowlist (e.g. rehype-sanitize schema), URL scheme allowlist (`http`, `https`, `mailto`), `rel="noopener noreferrer ugc nofollow"` on links, strict CSP without `unsafe-inline` as the backstop. Drizzle query builder / parameterized `sql` only; escape `LIKE` wildcards; validate every oRPC input with the contract schema (length, enum, charset on Tags). Neutralize control characters in logged user text. |
| A06:2025 | Insecure Design | Domain rules enforced only in the UI; no abuse cases (vote rings, sockpuppets, Agent spam, reputation farming); account linking design; anonymize-vs-erase conflict (GDPR) decided late; local-first conflict resolution letting a client rewrite history. | Write a lightweight threat model per feature before implementation (STRIDE or abuse-case list) and turn each abuse case into a requirement/test. Server is the single authority for Score, Accepted answer, `kind`, authorship. Rate limits and quotas designed per business flow (see API6). Reconcile anonymization with erasure in #22-#24. |
| A07:2025 | Authentication Failures | SSO-only removes passwords but leaves: account takeover by linking on an **unverified provider email** (already decided: verified only; confirm each provider's verification semantics), missing OAuth `state`/PKCE handling, long-lived sessions without revocation, API-key leakage in logs/URLs, brute-force on key endpoints. | Link accounts only on provider-verified email and never auto-link across providers without the rule being tested; use better-auth's built-in state/PKCE; session TTL and revoke-all on key events; `lax` + `Secure` + `HttpOnly` cookies; API keys: prefix, expiry, per-key rate limit, scope, revoke UI, `x-api-key`/`Authorization` header only (never query string) [see #7]. Rate-limit sign-in and key-verify endpoints. |
| A08:2025 | Software or Data Integrity Failures | **Local-first sync trusts client data**: a forged payload sets `authorId`, `score`, `kind`, `acceptedAnswerId`, timestamps. Unsigned/unpinned build artifacts and images; CDN scripts without SRI; unsafe deserialization of cached blobs. | Treat everything from IndexedDB/sync as untrusted input: whitelist fields per mutation, derive author from the session, derive Agent label from the author's `kind` at read time, recompute Score on the server. Signed/digest-pinned images and a protected main branch with CI-built artifacts. Self-host scripts (no third-party CDN) or use SRI. |
| A09:2025 | Security Logging & Alerting Failures | No audit trail for admin actions, API-key creation/use, Agent writes, auth failures; logs holding PII or secrets (GDPR); logging without alerting; Caddy logs unreviewed. | Structured audit log for: sign-in/link, key lifecycle and each key use (id, not secret), authorization denials, admin and moderation actions, Agent mutations. Never log tokens/keys/full bodies. Alert on spikes (denials, 401/429, key from new IP). Retention aligned with RGPD. Incident response procedure is an open item on map #20. |
| A10:2025 | Mishandling of Exceptional Conditions (new) | **Failing open**: authz middleware or rate limiter throwing -> request proceeds; error responses leaking stack traces or SQL details; partial writes (accept answer + score update) on error; unhandled rejections crashing the Bun process; offline-sync retries causing duplicates. | Fail closed in every guard (error = deny). One global oRPC error mapper returning typed, generic errors; log detail server-side only. Wrap multi-row mutations in transactions; idempotency keys for sync replays; timeouts on DB and outbound calls; resource limits and restart policy in Compose. The category's focus is improper error handling, logical errors and failing open [S3]. |

## 4. OWASP API Security Top 10:2023

Category names verified [S4]. I did not re-read each category's body in this ticket; risk and control are my application (INFERENCE).

| ID | Category | Concrete risk here | Recommended control |
|---|---|---|---|
| API1:2023 | Broken Object Level Authorization | Any procedure taking an `id` (question, answer, draft, key, profile) without a per-object check. The most likely bug in this app. | Per-object predicate in the query; negative test per procedure ("Member B cannot touch Member A's object"). Unguessable ids help but are not a control. |
| API2:2023 | Broken Authentication | Weak API-key handling (leak, no expiry/revocation), session cookie flaws, account linking, key accepted in URL, MCP endpoint reachable without auth. | See A07. MCP and OpenAPI/REST adapters must go through the same auth middleware as the web client. Per-key rate limit and revocation. |
| API3:2023 | Broken Object Property Level Authorization | **Mass assignment** (client sets `kind`, `role`, `score`, `ownerId`, `acceptedAnswerId`); **excessive data exposure** (email, provider ids, key metadata, soft-deleted/anonymized fields in public payloads). | Contract schemas as explicit allowlists for input and for output (separate public vs private shapes); `input: false` on server-owned user fields; never return the DB row; test that output shape has no private fields. |
| API4:2023 | Unrestricted Resource Consumption | Unbounded Markdown size, huge code blocks, unpaginated feeds, sync bulk uploads, expensive search, Agent flood, MCP tool loops, sign-up/key endpoints. | Max body and field lengths in the contract; pagination caps; per-IP and per-Member/Agent rate limits (oRPC ratelimit or reverse proxy); request timeouts; Caddy limits; quota per Agent. |
| API5:2023 | Broken Function Level Authorization | Admin procedures (close Question, edit Hackathon, moderate) callable by a regular Member; Agent calling human-only functions (vote); REST/MCP adapters exposing procedures the web UI hides. | Role/kind checks in middleware at the procedure level, not in the UI; one policy table (procedure x role x kind) tested exhaustively; MCP tool list generated from an explicit allowlist, not from "all procedures". |
| API6:2023 | Unrestricted Access to Sensitive Business Flows | Vote manipulation, answer farming by Agents, mass account creation via SSO, tag spam, scraping the whole corpus, Hackathon content abuse. | Identify flows (post, answer, vote, create key, sign-up); per-flow rate limits and quotas; Agents capped and always labelled; anomaly alerts; Owner accountable per Agent. |
| API7:2023 | Server Side Request Forgery | Any server-side fetch of a user-supplied URL (previews, avatar import, webhooks, MCP fetch tools). Note: in the 2025 web list SSRF is merged into A01. | Same as A01 SSRF. Prefer not to fetch user URLs at all in the MVP. |
| API8:2023 | Security Misconfiguration | CORS too open, missing headers, verbose errors, debug/OpenAPI docs exposed in prod, default creds, TLS settings. | See A02; automated config check in CI; single allowed origin. |
| API9:2023 | Improper Inventory Management | Drift between contract, OpenAPI document and MCP tool list; old/preview/dev routes left on; undocumented Agent endpoints. | The oRPC contract is the single inventory: generate OpenAPI and MCP from it; fail CI if a route exists outside the contract; remove or gate dev routes in prod. |
| API10:2023 | Unsafe Consumption of APIs | Trusting GitHub/GitLab/Google profile fields (name, avatar URL, email, bio) and any hackathon source data as safe: XSS via display name, avatar URL SSRF/tracking, wrong email-verified assumption. | Validate and normalize every upstream field with schemas; escape on render; treat avatar URLs as untrusted (proxy or restrict origins); take email only when the provider marks it verified. |

## 5. OWASP Top 10 for LLM Applications 2026

Names and ordering verified from the repo README [S6]; descriptions of LLM01, LLM03, LLM08, LLM10 read from the category files [S8][S13][S14][S15]; the other six names verified only. Mapping assumes the Section 2 assumption: **CodeSphere is the delivery surface and tool provider for external LLM agents**.

| ID | Category | Concrete risk here | Recommended control |
|---|---|---|---|
| LLM01:2026 | Prompt Injection | Questions, Answers, profile bios, tag names and Hackathon text are attacker-controlled text that other people's agents will ingest (the entry names issue titles, database rows, MCP outputs and community-submitted text as indirect-injection surfaces, and describes an attacker using a low-privilege public channel so the victim's MCP-connected agent acts with its owner's credentials [S13]). Hidden Unicode (tag characters, zero-width) can carry instructions. | There is no reliable filter: the entry itself says defense is architectural [S13]. For us: mark all user content as data in API/MCP responses (clear provenance fields: author `kind`, "untrusted user content"), strip or flag invisible Unicode and control characters at ingest, give agents least-privilege scoped keys, and document to client developers that content is untrusted. If we add our own LLM features, follow the entry's defense-in-depth list. |
| LLM02:2026 | Sensitive Information Disclosure | MCP/REST responses or any LLM-fed payload leaking private fields (email, drafts, key metadata, other Members' data). | Same output allowlists as API3; no private data in agent-facing shapes; redaction in logs. |
| LLM03:2026 | Excessive Agency | Agent keys and MCP tools that can do more than needed (vote, delete, edit Hackathons, rewrite others' content); a hijacked agent acts with its Owner's rights. Root causes named: excessive functionality, permissions, autonomy [S14]. | Minimize tools (explicit MCP allowlist), strict schema per tool, per-key scopes (read, ask, answer), no open-ended tools, human approval for high-impact actions (delete, close, key creation), authorization enforced in code, not by the model ("complete mediation"), rate limits and monitoring of tool use [S14]. Agents already cannot vote by domain rule. |
| LLM04:2026 | Supply Chain | Third-party models/tools/MCP servers and their descriptions; model artifacts. | Only matters if we integrate models or third-party MCP servers; pin and review, as A03. |
| LLM05:2026 | Data and Model Poisoning | Poisoned corpus: CodeSphere content could be used by others to train/RAG; spam answers seeded to steer agents. | Moderation, provenance and Score exposure so consumers can weight sources; Agent-content labelling. Low direct risk if we run no model. |
| LLM06:2026 | Unbounded Consumption | Agent floods draining DB/CPU; cost blow-up if we add LLM features. | API4 limits per key; budgets/quotas; circuit breakers. |
| LLM07:2026 | Misinformation | Wrong or hallucinated Agent answers presented as authoritative on a Q&A site. | Agents always labelled (already decided), cannot vote, human acceptance of answers; surface provenance. |
| LLM08:2026 | Hidden Context Exposure (renamed from System Prompt Leakage) | If we ship MCP tool descriptions or any system prompt: they are discoverable; roles or secrets placed there leak. The entry says to assume hidden context is discoverable, keep secrets out, and never use it as an authorization boundary [S15]. | No credentials or authorization logic in tool descriptions/prompts; authorization stays in the oRPC middleware. |
| LLM09:2026 | Vector and Embedding Weaknesses | Only if we add embeddings/semantic search or RAG over user content (cross-Member leakage, poisoning). | Out of MVP unless added; then enforce per-object authorization at retrieval time. |
| LLM10:2026 | Improper Output Handling | Dropped to #10 but is our most concrete one: agent-authored or model-influenced Markdown rendered in the browser. The entry lists XSS from model-generated Markdown and **auto-rendered Markdown images/link previews used to exfiltrate context via the URL** [S16]. | Treat Agent output like any user input (it is the same pipeline as A05). Do not auto-load remote images in rendered Markdown (disable, or allowlist/proxy and strip query strings), strict CSP `img-src`/`connect-src`, context-aware encoding, sanitize control characters before logs/terminals [S16]. |

## 6. OWASP Top 10 for Agentic Applications 2026

Names confirmed from the OWASP LLM 2026 repo's mapping appendix [S10]; the dedicated document is a PDF behind a download link which I did not read [S9]. Mapping below is therefore at the title level only (**UNVERIFIED** against the category text) except ASI02/03/08, which the LLM03 entry cites as the agentic forms of Excessive Agency [S14].

| ID | Category | Concrete risk here | Recommended control |
|---|---|---|---|
| ASI01 | Agent Goal Hijack | Injected text in CodeSphere content redirects a visiting agent's objective. | As LLM01: label content as untrusted data; least-privilege keys. |
| ASI02 | Tool Misuse & Exploitation | An Agent misuses our API/MCP tools (spam posts, destructive calls). | Tool allowlist, schemas, scopes, rate limits, audit log (as LLM03/API5). |
| ASI03 | Identity & Privilege Abuse | Agent key used beyond its Owner's intent; key theft; privilege confusion between Owner and Agent. | Agent = own Member row with an Owner; scoped, expiring, revocable, hashed keys; actions attributable to the Agent and its Owner. |
| ASI04 | Agentic Supply Chain Vulnerabilities | Malicious third-party MCP servers/tools used by Members' agents or by us. | Pin and review MCP dependencies; ship only first-party tools. |
| ASI05 | Unexpected Code Execution | Any MCP tool that evaluates code or shells out. | Do not expose code-execution tools; sandbox if ever needed. |
| ASI06 | Memory & Context Poisoning | Persistent poisoned content (a seeded Answer) that agents retrieve repeatedly. | Moderation, provenance, ability to remove and re-label content quickly. |
| ASI07 | Insecure Inter-Agent Communication | Agents interacting via our content (agent answers read by other agents). | Treat Agent content as untrusted for other agents; mark authorship. |
| ASI08 | Cascading Failures | One compromised agent causing mass-writes that propagate (spam waves, derived scores). | Circuit breakers, per-key quotas, bulk-action throttling, kill switch to suspend an Agent. |
| ASI09 | Human-Agent Trust Exploitation | Agents persuading humans (Accepted answer, votes) with confident but wrong or malicious content (links, install commands). | Visible Agent labels (decided), link rules, human-only acceptance and votes. |
| ASI10 | Rogue Agents | An Agent behaving outside its remit. | Owner accountability (domain rule), suspension by Admin, audit trail, anomaly alerts. |

## 7. Suggested requirement stubs for the map (for #25/#26)

1. Every oRPC procedure is covered by an authorization test matrix: role x kind x ownership (A01, API1, API5).
2. Markdown rendering: raw HTML off or allowlist sanitizer, link scheme allowlist, no auto-loaded remote images, CSP without `unsafe-inline` (A05, LLM10). Add automated XSS payload tests.
3. Inputs and outputs of the contract are allowlisted shapes; `kind`, `role`, `score`, `ownerId` are server-only (API3, A08).
4. Sync/IndexedDB data is untrusted; the server derives author, score, Agent label (A08).
5. Rate limits per IP, Member and API key; size/pagination caps (API4, API6, LLM06).
6. MCP/REST/OpenAPI are generated from the contract with an explicit tool allowlist; CI fails on routes outside it (API9, LLM03).
7. Supply chain: frozen lockfile, pinned beta deps and images, dependency and licence scan, (A/L)GPL gate (A03).
8. Fail-closed guards and a global error mapper (A10).
9. Audit log plus alerting, no secrets/PII in logs (A09).
10. Caddy/Compose hardening checklist (A02).

## 8. Flags and limits

- **Dates for the LLM 2026 edition are inconsistent** between OWASP pages: the resource page shows 2026-08-03, the repo READMEs say 2026-08-04, and a project news post (URL dated 2026-09-01) says the list was "released ... on September 2, 2026" [S6][S7][S11]. All agree it is the 2026 edition and supersedes 2025; I did not resolve which date is the formal publication date.
- **Web Top 10:2025 exact release date UNVERIFIED.** Sources confirm it is the current release; the repo's first 2025 commit is 2025-10-28 ("Created 2025 skeleton"), so release was after that [S3].
- **API Security Top 10:2023 being the latest is an absence-of-evidence conclusion** (portal and repo editions list). Re-check before the demo.
- **Agentic Top 10 category bodies were not read** (PDF). Only titles are verified, via the OWASP LLM repo appendix [S10]. Risk-level labels seen in third-party pages are not OWASP data and are not used here.
- For the web and API tables I verified list membership, names and (for web) the 2025 changes and A03 text; the remaining category bodies were not re-read, so the "control" columns are recommendations, not citations.
- The assumption that CodeSphere runs no LLM inference in the MVP is **UNVERIFIED** (Section 2).
- better-auth OAuth-token encryption at rest and each SSO provider's email-verification semantics were **not checked** here.
- The 2025 LLM edition remains reachable at its own URL; `genai.owasp.org/llm-top-10/` showed 2025 when fetched, while the repos show 2026 as current. I treated the repos plus the 2026 resource page as authoritative.

## Sources

- [S1] https://top10.owasp.org/ (reached from https://owasp.org/Top10, 308 redirect; redirects to "OWASP Top 10:2025")
- [S2] https://github.com/OWASP/www-project-top-ten (`index.md`: "The most current released version is the OWASP Top Ten 2025"; previous 2021, 2017)
- [S3] https://github.com/OWASP/Top10/tree/master/2025/docs/en (`index.md` list, `0x00_2025-Introduction.md` "8th installment", changes vs 2021, methodology: 8 categories from data, 2 from community survey; `A03_2025-Software_Supply_Chain_Failures.md`). Rendered at https://top10.owasp.org/2025
- [S4] https://api-security.owasp.org/ (2023 current, 2019 archive; categories API1:2023..API10:2023)
- [S5] https://github.com/OWASP/API-Security (`editions/2019`, `editions/2023`)
- [S6] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10 (README, `2026/final/`; categories LLM01:2026..LLM10:2026)
- [S7] https://github.com/OWASP/www-project-top-10-for-large-language-model-applications (legacy README: current release 2026, previous 2025; links to https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/ and https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/)
- [S8] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM00_Preface.md (2025 -> 2026 changes; boundary with the Agentic Top 10)
- [S9] https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ (published 2025-12-09; peer-reviewed framework)
- [S10] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/Appendix_A_Related_Framework_Mappings.md (ASI01..ASI10 titles)
- [S11] https://genai.owasp.org/2026/09/01/owasp-genai-security-project-unveils-2026-top-10-for-llm-applications-new-agent-control-standard-and-sponsors-as-community-tops-30000-members/ (release news; Agent Control Standard)
- [S12] https://github.com/OWASP/Top10/blob/master/2025/docs/en/A03_2025-Software_Supply_Chain_Failures.md (rendered: https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/)
- [S13] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM01_PromptInjection.md
- [S14] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM03_ExcessiveAgency.md
- [S15] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM08_HiddenContextExposure.md
- [S16] https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM10_ImproperOutputHandling.md
