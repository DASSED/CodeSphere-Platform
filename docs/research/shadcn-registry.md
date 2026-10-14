# shadcn registry, shoogle.dev, and candidate registries for a Q&A/feed platform

Research ticket: #3 (child of map #1). Researched on 2026-10-03 against live sources.
CLI version used for hands-on checks: `shadcn@4.21.1`.

## TL;DR

- A shadcn **registry** is just static (or dynamic) JSON: one `registry.json` index plus one `{name}.json` per **item**. Items carry file contents, npm dependencies, other-registry dependencies, CSS variables, etc. The CLI copies the files into your repo ("open code"), it does not install a package.
- **Namespaces** (`@acme/button`) map to URL templates in `components.json` under `registries`. Registries listed in the official **registry index** (`https://ui.shadcn.com/r/registries.json`, 418 entries today) work with **no config**: the CLI adds them for you on first `add`/`search`.
- The **shadcn MCP server** (`npx shadcn@latest mcp`) exposes 7 tools to browse/search/view/install across the registries configured in `components.json`.
- **shoogle.dev** is a third-party search engine over the registry ecosystem. It is itself exposed as a registry namespace (`@shoogle`) so `shadcn search @shoogle -q "..."` works, plus a hosted MCP server (`https://mcp.shoogle.dev/mcp`, no auth) with 2 name-search tools. It is labelled **Alpha** and searches item **names**, not semantics.
- For our platform: use **core shadcn** for cards, forms, tables, combobox-with-chips (tags), badges, avatars, empty states; add **`@kibo-ui`** (tags, code-block, editor, table), **`@prompt-kit`** (Markdown renderer with Shiki code blocks), and **`@data-table-filters` / `@niko-table`** if we need rich tables. There is **no ready-made vote/upvote button** in any registry we found: build it from `Button`/`Toggle` (about 20 lines).

## 1. How the shadcn registry works

### 1.1 Concept

> "A registry is a distribution system for code. ... run your own code registry ... distribute your custom components, hooks, pages, config, rules and other files to any project." and it "works with any project type and any framework, and is not limited to React."
> Source: <https://ui.shadcn.com/docs/registry>

Items are not limited to UI: a GitHub registry page lists docs, CI workflows, `AGENTS.md`, `.mcp.json`, etc. as valid payloads (<https://ui.shadcn.com/docs/registry/github>).

### 1.2 `registry.json` (the index)

Entry point of a registry. Required at root: `name`, `homepage`, `items[]`. Optional `include[]` composes several `registry.json` files (included files may omit `name`/`homepage`).

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "homepage": "https://acme.com",
  "items": [
    {
      "name": "login-form",
      "type": "registry:component",
      "title": "Login Form",
      "description": "A login form component.",
      "registryDependencies": ["button", "@acme/input-form", "https://example.com/r/foo"],
      "dependencies": ["is-even@3.0.0", "motion"],
      "files": [{ "path": "registry/new-york/auth/login-form.tsx", "type": "registry:component" }]
    }
  ]
}
```

Sources: <https://ui.shadcn.com/docs/registry/registry-json>, <https://ui.shadcn.com/docs/registry/registry-index>, JSON schema at <https://ui.shadcn.com/schema/registry.json>.

### 1.3 Items (`registry-item.json`)

Source: <https://ui.shadcn.com/docs/registry/registry-item-json>.

| Field | Meaning |
|---|---|
| `name`, `title`, `description`, `author` | Identity and human/AI-readable description |
| `type` | `registry:ui`, `:component`, `:block`, `:hook`, `:lib`, `:page` (needs `target`), `:file` (needs `target`), `:style`, `:theme`, `:base`, `:font`, `:item` |
| `files[]` | `{ path, type, target? }`; at install, `content` is inlined in the built JSON |
| `dependencies` / `devDependencies` | npm packages, `pkg@version` allowed |
| `registryDependencies` | other items: bare name (= built-in shadcn item), `@ns/item`, `owner/repo/item` (GitHub), full URL, or file path |
| `cssVars` (`theme`, `light`, `dark`), `css` | Tailwind v4 CSS variables and `@layer`/keyframes/plugins injected into the project CSS |
| `envVars`, `docs`, `categories`, `meta` | `.env.local` entries (never overwritten), CLI message, tags, custom metadata |

Target placeholders such as `@components/`, `@ui/`, `@lib/`, `@hooks/` resolve from the project's `components.json` aliases; `~` means project root.

Example of a multi-file item (page + components + hook + lib + config): FAQ at <https://ui.shadcn.com/docs/registry/faq>.

### 1.4 Building and serving

- `npx shadcn@latest build` reads `registry.json` and writes `public/r/{name}.json` (override with `--output`). Any static host works; dynamic route handlers are also supported.
- The catalogue lives at `https://acme.com/r/registry.json`, items at `https://acme.com/r/{name}.json`. The MCP server needs that `registry.json` to exist.
- Consumers can install by URL: `shadcn add https://acme.com/r/button.json`.
- **GitHub registries**: any public GitHub repo with a root `registry.json` is usable as `npx shadcn@latest add owner/repo/item`, optionally pinned with `#ref` (branch, tag or SHA). Private repos are **not** supported this way; use a namespace with authenticated URLs. (<https://ui.shadcn.com/docs/registry/github>, FAQ)

Sources: <https://ui.shadcn.com/docs/registry/getting-started>, <https://ui.shadcn.com/docs/registry/mcp>.

### 1.5 Namespaces

Declared in `components.json`:

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/resources/{name}.json",
    "@private": {
      "url": "https://api.company.com/registry/{name}.json",
      "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" },
      "params": { "version": "latest" }
    }
  }
}
```

- `{name}` is required; `{style}` is optional and is replaced by the project's style (e.g. `new-york`).
- `headers`/`params` support `${ENV_VAR}` expansion from `.env.local`; always use HTTPS and never commit tokens.
- The CLI validates every downloaded item against the registry-item schema.
- Usage: `shadcn add @acme/button @lib/auth-utils`, `shadcn view @acme/button`, `shadcn search @acme --query "auth"`.

Source: <https://ui.shadcn.com/docs/registry/namespace>.

### 1.6 The registry index ("directory")

- `https://ui.shadcn.com/r/registries.json` lists open-source registries (418 entries when fetched). When you run `shadcn add`/`search` with an `@name` that is in the index, "the CLI will automatically check the registry index ... and add it to your `components.json`". (<https://ui.shadcn.com/docs/registry/registry-index>)
- Submission = pull request adding the registry to `apps/v4/registry/directory.json` in `shadcn-ui/ui`. Requirements: open source, valid schema, flat layout (`/registry.json`, `/name.json` at root), no `content` in `files` of the index.
- **Registry Health** (experimental) hourly/daily/weekly checks only for directory-listed registries; statuses Observing / Healthy / Degraded / Unavailable (<https://ui.shadcn.com/docs/registry/health>). Observed: each entry in `registries.json` carries `health` (status, score, 7d/30d availability) and `ranking` (`score`, `itemCount`) fields. This is useful to filter out dead registries. (These two fields are observed in the JSON; their schema is not documented beyond the health page.)
- Caveat from the docs: community registries are third-party; "always review code on installation".

### 1.7 CLI surface relevant to us

From <https://ui.shadcn.com/docs/cli>:

| Command | Use |
|---|---|
| `shadcn init -t start` | Scaffold TanStack Start + shadcn (also `--monorepo`, `--preset`, `--base`) |
| `shadcn add <item...>` | Install items (`--dry-run`, `--diff`, `--overwrite`, `--all`, `--path`, `-c apps/web` to target a workspace) |
| `shadcn view <item...>` | Print item JSON (deps, files) before installing |
| `shadcn search <registry...> -q <text> -l <n> -o <offset>` (alias `list`) | Search/list one or more registries |
| `shadcn build` | Generate `public/r/*.json` for our own registry |
| `shadcn info`, `docs`, `migrate`, `mcp init` | Misc |

TanStack Start specifics: install guide at <https://ui.shadcn.com/docs/installation/tanstack> (`npx shadcn@latest init -t start`, monorepo: run `add` from `apps/web` or pass `-c apps/web`; components import from `@/components/ui/...`, or `@workspace/ui/components/...` in a monorepo). This matters because better-t-stack generates a Turborepo; confirm which layout it produces before running `add`.

### 1.8 The shadcn MCP server

Source: <https://ui.shadcn.com/docs/mcp>; tool names verified in the CLI source (`packages/shadcn/src/mcp/index.ts` in `shadcn-ui/ui`).

- Setup: `npx shadcn@latest mcp init --client claude` (also `cursor`, `vscode`, `opencode`; Codex via `~/.codex/config.toml`). Equivalent manual config: command `npx`, args `["shadcn@latest", "mcp"]`. In Claude Code, `/mcp` helps debug.
- It reads the `registries` of the project's `components.json`, so any namespaced registry (including `@shoogle`, and private ones with auth) is browsable.
- Tools (7): `get_project_registries`, `list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`, `get_audit_checklist`.
- Registry authors need no special MCP support beyond a root `registry.json`; recommended practices: clear descriptions, accurate `dependencies`, `registryDependencies`, kebab-case names (<https://ui.shadcn.com/docs/registry/mcp>).

## 2. shoogle.dev

Facts below are from shoogle.dev pages and live calls made on 2026-10-03.

- **What**: "shadcn UI components & blocks search engine"; searches blocks, components and templates across community registries. Site sections: Explore, Fresh, Bookmarks, Directory, MCP, `/search`, per-item pages like `/shadcn-components/<name>`. The MCP docs are marked **Alpha**. (<https://shoogle.dev>, <https://shoogle.dev/mcp>)
- **Three ways to use it**
  1. **Web**: browse/search at shoogle.dev; the MCP skill page recommends `shoogle.dev/search` "for semantic or layout-based block discovery" (<https://shoogle.dev/mcp/shoogle-skills>). I did not test the semantic search UI.
  2. **CLI, no MCP needed**: Shoogle is a namespace in the official index (`@shoogle`, URL `https://shoogle.dev/r/{name}.json`). `npx shadcn@latest search @shoogle -q carousel`. `q` is required; `type` (e.g. `registry:ui,registry:block`), `limit`, `offset` are optional (<https://shoogle.dev/mcp/cli>). Verified working: `search @shoogle -q "tags input"` returned 100 hits.
  3. **MCP server**: `claude mcp add shoogle --transport http --scope user https://mcp.shoogle.dev/mcp` (<https://shoogle.dev/mcp/claude>); generic JSON `{"mcpServers":{"shoogle":{"url":"https://mcp.shoogle.dev/mcp"}}}`, streamable HTTP, no auth (<https://shoogle.dev/mcp/other-mcp-clients>). Verified by `initialize` + `tools/list`: tools are `search_registry_items` (query, offset, limit) and `search_registry_items_scoped` (query, registries[], offset, limit). Descriptions say these are **name** searches via a Convex full-text index, and the results include a ready `npx shadcn@latest add ...` command.
- **Skill**: a "Shoogle Skill" teaches an agent when to call these tools (install command is shown on <https://shoogle.dev/mcp/shoogle-skills>; the page text suggests `skills add https://github.com/alibey-10/shoogle --skill ...` but the command is rendered client-side and I did not capture it fully).
- **Result naming**: Shoogle results are namespaced by the origin registry: `@shoogle/<registry>/<item>`, e.g. `@shoogle/kibo-ui/editor`, `@shoogle/prompt-kit/markdown`.

### Gotchas found while testing (important for the method)

1. **Not every Shoogle hit installs through `@shoogle`.** `shadcn view @shoogle/prompt-kit/markdown` and `@shoogle/kibo-ui/tags` worked, but `@shoogle/diceui/tags-input` returned 404 (`https://shoogle.dev/r/diceui/tags-input.json`). The native `@diceui/tags-input` and `@diceui/mention` also 404 under CLI 4.21.1 (it requests `https://diceui.com/r/new-york-v4/<name>.json`; Dice UI's `https://diceui.com/r/registry.json` lists 206 items but neither `tags-input` nor `mention` appears there). Treat Dice UI as unverified/stale for now and always run `shadcn view <item>` (or `add --dry-run`) before committing to a component.
2. **`shadcn search` is fuzzy and noisy** on big registries: `search @reui -q "vote"` returned 618 mostly irrelevant hits. Use precise names, `-l`, and the `type` filter, or search by concrete item name.
3. **Shoogle searches names only**: query for what the item is called ("tags-input", "markdown", "mention"), not for the use case.
4. Stats shown on Shoogle (component and registry counts) are animated counters in the page; I could not read exact numbers.

## 3. Recommended search method (for the team and for agents)

1. **Core first**: check `npx shadcn@latest search @shadcn -q <term>` (471 items today, including `card`, `badge`, `avatar`, `field`, `input-group`, `table`, `pagination`, `combobox`, `empty`, `item`, `spinner`, `skeleton`, `tabs`, `toggle-group`, plus chat-oriented `bubble`, `message`, `message-scroller`, `marker`, `attachment`).
2. **Shoogle for breadth**: `npx shadcn@latest search @shoogle -q "<name-like term>" -l 10` or the Shoogle MCP, or shoogle.dev/search in a browser for layout ideas.
3. **Scoped follow-up**: once a registry looks right, search it directly (`search @kibo-ui -q table`) and read health/ranking in `registries.json`.
4. **Vet before install**: `npx shadcn@latest view @ns/item` (check `dependencies` and file contents), then `add ... --dry-run`.
5. **Enable the shadcn MCP** (`npx shadcn@latest mcp init --client claude`) so an agent can do 1 to 4 itself; add Shoogle MCP only if we want cross-registry name search from the agent.
6. **Prefer registries that are healthy and maintained** (health `healthy`, high `ranking.score`, active repo) and pin versions in `package.json` since code is copied, not versioned.
7. Because we are on TanStack Start with a Tailwind v4 stack, confirm each candidate has no Next.js-only imports (`next/link`, `"use client"` directives are harmless but `next/*` imports are not). I did not audit this per item.

## 4. Candidates for our Q&A/feed platform

All items below were seen in the live index or verified via `shadcn view`/`search` on 2026-10-03 unless marked.

| Need | Candidate | Source / evidence | Notes |
|---|---|---|---|
| Question/answer **cards**, feed items | `@shadcn/card`, `@shadcn/item`, `@shadcn/avatar`, `@shadcn/badge`, `@shadcn/separator` | core registry listing | Compose; best base for a StackOverflow/daily.dev feel |
| Feed/activity | `@reui` blocks (e.g. `c-timeline-11` "Activity feed timeline with user avatars", `c-item-12`) | `search @reui -q feed` | ReUI is a very large registry (1,000+ items per its description); useful as layout reference |
| **Vote buttons** | none found | searches for "vote"/"upvote" only gave an icon (`@lucide-animated/upvote`) and an animated number (`@ui-layouts/motion-number-upvotes`) | Build from `Button`/`Toggle` + optimistic mutation; ~20 lines. Gap to note in the spec |
| **Tag input** (question tags) | `@shadcn/combobox` with `multiple` + `ComboboxChips`/`ComboboxChipsInput` | <https://ui.shadcn.com/docs/components/combobox> | Zero third-party dependency; best fit for tags |
| | `@kibo-ui/tags` | `view`: deps `lucide-react`; registry deps `badge button command popover` | Label picker, simple |
| | `@kibo-ui/combobox`, `@flowkit-ui` (Creatable Combobox) | search results | Creatable combobox is relevant if users can create new tags |
| **Markdown rendering + code** | `@prompt-kit/markdown` (+ `code-block`) | `view` verified: `react-markdown`, `remark-gfm`, `remark-breaks`, `marked`, `shiki`; renders fenced code via Shiki | Good for answers; uses `dangerouslySetInnerHTML` for Shiki HTML output (fine as Shiki output, but we must not feed it unsanitized HTML). Streaming-oriented block memoization is a bonus |
| | `@kibo-ui/code-block` | `view` verified: `shiki`, `@shikijs/transformers`; has `server.tsx` variant | Syntax highlight, line numbers, copy button |
| **Markdown/rich editor** (composer) | `@kibo-ui/editor` | `view` verified: TipTap (`@tiptap/starter-kit`, code-block-lowlight, table, suggestion, ...) | WYSIWYG TipTap, **not** a Markdown-source editor; whether it can export Markdown was not verified |
| | `@shadcn-editor` (Lexical) / `@zenoadmin` (Lexical, bilingual) / `@plate` / `@prosekit` | registry index descriptions | Alternatives; Markdown I/O not verified for any |
| | Plain `Textarea` (+ `InputGroup` toolbar) with `@prompt-kit/markdown` preview | core | Simplest and lightest for 2G/3G audiences; Markdown stays the stored format |
| **@mention** | `@diceui/mention`, `@stealth/mention-input`, `@hirael/mention-input` | Shoogle search for "mention" | `@diceui` fails to install today (see gotchas); others not installed/tested |
| **Tables** | `@shadcn/table` + data-table guide (TanStack Table) | <https://ui.shadcn.com/docs/components/data-table> | Official recipe |
| | `@data-table-filters` (openstatus), `@niko-table`, `@tablecn`, `@kibo-ui/table` | registry descriptions; `@kibo-ui/table` verified deps `@tanstack/react-table`, `jotai` | Faceted filters, server-side pagination; use for admin/leaderboard/hackathon lists if needed |
| **Forms** | `@shadcn/field`, `@shadcn/input-group`, `@shadcn/form` + TanStack Form guide (<https://ui.shadcn.com/docs/forms/tanstack-form>) | core docs | Official TanStack Form docs fit TanStack Start well; `@formcn`, `@buzzform` are generators, not needed for MVP |
| **Auth blocks** | `@shadcn/login-01..05`, `@shadcn/signup-01..05`, `@better-auth-ui` (54 items) | listings | Only relevant if the auth ticket picks Better Auth |
| Empty / loading states | `@shadcn/empty`, `skeleton`, `spinner`; `@elsecase` | listings | Needed for offline/sync states (local-first) |
| Hackathon section (cards, calendar, timeline) | `@kibo-ui/calendar`, `@kibo-ui/relative-time`, `@shadcn/tabs`; `timeline` exists in Dice UI's `registry.json` but Dice UI installs are currently broken (see gotchas) | listings | |
| Africa-specific | `@logoforge` ("includes ... African brands") | registry description | Marginal; only an icon/logo set |
| Wrong-fit | `@lens-blocks` (Lens Social Protocol), AI-chat registries (`@ai-elements`, `@assistant-ui`, `@prompt-kit` chat parts) | descriptions | Skip, except `@prompt-kit/markdown` |

Health snapshot (from `registries.json`, 2026-10-03): `@kibo-ui` healthy (score 96, 41 items), `@prompt-kit` healthy (98, 23 items), `@reui` healthy (98.6, 79 listed items), `@shadcnblocks` **degraded** (78.8), `@cult-ui` healthy but low score (66.7). Scores are the index maintainers' composite and the model is explicitly experimental.

## 5. Suggested decisions for the map

- Treat core shadcn + a **plain-Markdown pipeline** (Textarea composer, `@prompt-kit/markdown` renderer, Shiki) as the default content stack; evaluate `@kibo-ui/editor` only if WYSIWYG becomes a requirement (heavier: TipTap + lowlight).
- Tag input: core `Combobox` with chips.
- Own the vote button.
- Install `shadcn` MCP in the repo (`mcp init`) and add the `@kibo-ui`, `@prompt-kit` namespaces to `components.json` only if/when needed (they are in the index, so the first `add` auto-registers them).
- Consider publishing our own small registry later (e.g. vote button, answer card) via a GitHub registry; not needed for the MVP.

## 6. Not verified / limitations

- Shoogle: exact index size, ranking method for its web search, semantic-search behavior, and the full skill install command were not verified. It is Alpha and may change.
- Dice UI items (`tags-input`, `mention`) could not be installed with CLI 4.21.1; cause not diagnosed (possibly a style-path change on their side).
- TanStack Start compatibility of each third-party item was not audited (no code was installed into a project; checks were `view`/`search` only).
- Markdown import/export of the Lexical/TipTap/Plate editors was not verified.
- Licenses of candidate registries were not checked (do this before adoption).
- Counts (418 registries, 471 core items, 1,013/1,000+ ReUI items) are point-in-time values and move daily.

## Sources

- shadcn docs: <https://ui.shadcn.com/docs/registry>, `/registry/getting-started`, `/registry/registry-json`, `/registry/registry-item-json`, `/registry/namespace`, `/registry/github`, `/registry/registry-index`, `/registry/health`, `/registry/mcp`, `/registry/faq`, `/cli`, `/mcp`, `/installation/tanstack`, `/components/combobox`, `/components/data-table`, `/forms` (all under `https://ui.shadcn.com/docs/`; the `.md` suffix returns raw source)
- Registry index data: <https://ui.shadcn.com/r/registries.json>; JSON schemas: <https://ui.shadcn.com/schema/registry.json>, <https://ui.shadcn.com/schema/registry-item.json>
- shadcn MCP tool names: `packages/shadcn/src/mcp/index.ts` in <https://github.com/shadcn-ui/ui>
- Shoogle: <https://shoogle.dev>, `/mcp`, `/mcp/cli`, `/mcp/claude`, `/mcp/other-mcp-clients`, `/mcp/shoogle-skills`; live MCP endpoint `https://mcp.shoogle.dev/mcp` (`initialize`, `tools/list`)
- Registry item payloads: `https://www.kibo-ui.com/r/{editor,tags,code-block,table,combobox}.json`; `npx shadcn@latest view @shoogle/prompt-kit/markdown`; `https://diceui.com/r/registry.json`
