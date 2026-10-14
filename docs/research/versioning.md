# Versioning and changelogs in the Bun + Turborepo monorepo

Research ticket: #30 (map #28). Date: 2026-10-04. Repo state: `main` @ `78960f6`.

## Question

Does Changesets work with Bun workspaces and the `catalog:` / `workspace:*` protocols (versioning, `changeset version`, lockfile)? What are the alternatives (release-please, manual tags / CalVer)? Should apps and the oRPC contract be versioned separately? How does it plug into GitHub Actions (version PR, tags, releases)?

## Repo facts that frame the answer

- Root `package.json`: `private: true`, `packageManager: bun@1.4.0`, a single default `catalog` under `workspaces`.
- Internal deps use `workspace:*` (e.g. `apps/web` and `packages/api` -> `@codesphere/contract`); third-party deps use `catalog:`. **No internal package is referenced through `catalog:`.**
- Only `@codesphere/config` and `@codesphere/ui` have a `version`; `server`, `web`, `@codesphere/contract`, `api`, `auth`, `db` have none. Nothing is published to npm; the deliverable is a deployed app.

## Findings

### 1. Changesets versioning works on this repo (verified by experiment)

Experiment in a throwaway copy of `main` (not committed): `@changesets/cli@3.0.3` installed with Bun 1.4.0 on Windows; added `version: 0.1.0` + `private: true` to `server`, `web`, `contract`, `api`; config with `privatePackages: { version: true, tag: true }`; one changeset (`contract: minor`, `server: patch`); ran `bunx changeset version`.

Observed:
- `contract` 0.1.0 -> 0.2.0, `server` -> 0.1.1; dependents `web` and `api` got a patch bump (`updateInternalDependencies: "patch"`), `server` changelog lists `@codesphere/api@0.1.1`.
- `CHANGELOG.md` created per package; the changeset file consumed.
- `workspace:*` and `catalog:` specifiers were left untouched (no rewrite, no error).
- `bun install` afterwards left `bun.lock` unchanged and `bun install --frozen-lockfile` passed; the lock's workspace entry still showed the old `version` (0.1.0). **Unverified**: whether Bun is meant to refresh that field; it did not break a frozen install here. Note: `bun install` reported "Failed to install N packages" on this Windows machine for optional native deps both before and after, unrelated to Changesets.
- `changeset init` in v3 is interactive (prompt for GitHub changelog), so in CI or scripts write `.changeset/config.json` by hand.

### 2. `catalog:` is a known gap in Changesets, but it does not hit us

- Changesets does not understand `catalog:` yet: a workspace package referenced *through a catalog* is treated as an invalid range, and releasing a package that a catalog points at leaves the catalog entry stale. A fix (new `@changesets/catalogs`, `detectCatalogChanges`) is in PR #2213, **open** and targeted at v3.1: https://github.com/changesets/changesets/pull/2213 (closes https://github.com/changesets/changesets/issues/1707).
- Our internal packages are linked with `workspace:*`, never `catalog:`, so this gap is irrelevant as long as that convention holds. Rule to keep: never put `@codesphere/*` in the catalog.
- Publishing is the other half of the problem: `changeset publish` shells out to `npm publish`, which resolves neither `workspace:` nor `catalog:`. Bun documents that `bun publish` / `bun pm pack` replace `catalog:` with the real range: https://bun.com/docs/install/catalogs ("Publishing" section). Irrelevant for us (nothing is published) but it means "use `bun pm pack` / `bun publish`, not `changeset publish`" if `@codesphere/contract` is ever published. Verified: `bun pm pack --dry-run` on `packages/contract` produced `codesphere-contract-0.2.0.tgz`.

### 3. Private apps are a supported Changesets use case

Changesets docs "Versioning apps": set `privatePackages: { version: true, tag: true }` (default is false/false); each app needs a minimal `package.json` with `name`, `private`, `version`; artifacts other than npm packages (Docker images) are built by a separate workflow triggered by the tags/releases. https://github.com/changesets/changesets/blob/main/docs/versioning-apps.md

### 4. GitHub Actions integration

`changesets/action` opens/updates a "Version Packages" PR (runs `changeset version`) while changesets are pending; when merged it runs the `publish` script, creates git tags and, with `createGithubReleases`, GitHub Releases. Needs `contents: write` and `pull-requests: write`. Outputs include `published`, `publishedPackages`, `pullRequestNumber`. https://github.com/changesets/action

For private-only repos the publish step can be `changeset tag` (creates `pkg@version` tags without npm) — **flagged unverified for v3 action behaviour with no npm publish**; check the action README on the pinned version before relying on automatic GitHub Releases.

Turborepo officially recommends Changesets for versioning/publishing in monorepos: https://turborepo.dev/docs/guides/publishing-libraries

### 5. Alternatives

- **release-please** (Google): manifest mode + `node-workspace` plugin builds a dependency graph of workspace packages; versions are derived from **Conventional Commits**, release PR per merge. Its docs do not mention Bun, `bun.lock`, `workspace:*` or `catalog:` (unverified support; it updates `package.json` / `package-lock.json`-style files, not `bun.lock`). https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
- **Manual tags / CalVer**: tag the repo (`v2026.10.25` or `v0.3.0`) on each deploy, GitHub "generate release notes" from PR titles. Zero tooling, one version for the whole product, no per-package changelog.

### 6. Separate versions for apps vs contract?

- `web` and `server` are always deployed together from one commit (same compose file); separate versions add bookkeeping without decision value. One product version is enough.
- `@codesphere/contract` only deserves its own semver if external consumers pin it (published client, MCP/agents relying on a versioned API). Today the public API is versioned by URL (`/api/v1`) and consumers get the OpenAPI document from the running server; the URL prefix is the compatibility contract, not the package version.
- If you do go with Changesets, the `fixed` config can lock `web`, `server`, `contract` to one version, getting per-change changelogs with a single number.

## Comparison

| Option | Setup cost | Fits Bun/`catalog:` | Changelog | Discipline required |
|---|---|---|---|---|
| Changesets (`fixed` group, private, `changeset tag`) | ~30 min + 1 workflow | Yes for our usage (verified); `catalog:`-linked internal pkgs not supported until v3.1 | Per package, from changeset text | Add a `.changeset/*.md` per PR |
| release-please | ~1 h | Not documented for Bun | From commit messages | Conventional Commits on every merge |
| Manual tag / CalVer + GitHub generated notes | ~5 min | N/A | From PR titles | Tag on deploy |

## Recommendation (solo dev, 3-week hackathon, submission 25 Oct)

1. **Do not adopt a release tool now.** Use **one product version** with manual tags at each deploy to the Systalink server (`v0.1.0`, `v0.2.0`, ..., `v1.0.0` for the CADEV submission), GitHub Releases with auto-generated notes from PR titles (one short branch per ticket already gives good PR titles). Tag also the Docker image with the same version.
2. **Do not version the contract separately**; the `/api/v1` prefix is the API's compatibility signal. Revisit only if `@codesphere/contract` gets published.
3. Keep the door open for Changesets (verified compatible): never reference `@codesphere/*` via `catalog:`; if a human-readable per-change `CHANGELOG.md` becomes a judging asset, add Changesets with `privatePackages: {version: true, tag: true}`, `fixed: [["web","server","@codesphere/contract"]]`, and `changesets/action` with `changeset tag` as publish step. Wait for PR #2213 (v3.1) before ever putting internal packages in the catalog.
4. Skip release-please: it imposes Conventional Commits and has no documented Bun support.

## Unverified / open points

- Whether `bun.lock`'s workspace `version` field is expected to be refreshed after `changeset version` (observed: not refreshed, frozen install still OK).
- `changesets/action` behaviour with private packages and `changeset tag` as publish script (GitHub Release creation) not tested end-to-end in CI.
- release-please + `bun.lock` not tested.
