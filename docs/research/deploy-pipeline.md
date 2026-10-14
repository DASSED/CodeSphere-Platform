# Research: deploying CodeSphere's docker compose to a Systalink Cloud Server from GitHub Actions

Resolves #29 (map #28). Status: research note, not a decision. Date: 2026-10-04.

## Question

How do we ship `web` (TanStack Start), `server` (Hono on Bun), Postgres 18 and Caddy to one Linux VM
(Systalink Cloud Server, Dakar) from GitHub Actions? Compare (a) CI-built images on GHCR + `docker compose pull && up -d`
over SSH, (b) building on the server, (c) Kamal / Coolify / Dokploy. Cover secrets, migrations, rollback, Caddy HTTPS, downtime.

Legend: **[V]** verified against the cited primary source during this research; **[U]** unverified / from
general knowledge, check before relying on it.

## Starting point in the repo (`main`)

- `docker-compose.yml` builds `apps/web/Dockerfile` and `apps/server/Dockerfile` locally; both use BuildKit
  secret mounts (`web_env`, `server_env` mapped from `apps/*/.env`) during `bun install`/`build`. [V, repo]
- `web` bakes `VITE_SERVER_URL` at build time via `ARG` — so the image is tied to its public API URL. [V, repo]
- Postgres is `postgres:18`, volume mounted at `/var/lib/postgresql` (the layout PG 18 images expect). Port 5432 is
  published to the host — must not be in prod. [V, repo]
- There is no `compose.prod.yml`, no Caddyfile and no migration service yet (map #28 says these are decided). [V, repo]
- Runtime images copy the whole `/app` from the builder (large images; matters for pull time over a Dakar link). [V, repo]

## Option (a) — build in CI, push to GHCR, pull over SSH

Flow: `docker/login-action` + `docker/build-push-action` push `ghcr.io/0xdaydy/codesphere-{web,server}:<git-sha>`;
an SSH step runs `docker compose -f compose.prod.yml pull && docker compose -f compose.prod.yml up -d --wait`.

- GHCR auth from Actions uses the built-in `GITHUB_TOKEN` with `permissions: packages: write`. [U — see
  https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions]
- BuildKit secrets are supported by `docker/build-push-action` via its `secrets:` input, so the Dockerfiles' `--mount=type=secret`
  keep working in CI and secrets do not land in image layers. [U — https://docs.docker.com/build/ci/github-actions/secrets/]
- Layer cache in CI: `cache-from/cache-to: type=gha`. [U — https://docs.docker.com/build/cache/backends/gha/]
- The server only needs Docker + a read token for GHCR (or public packages). No Bun, no source checkout.
- `docker compose up --pull always|missing|never`, `--wait` ("Wait for services to be running|healthy. Implies detached mode")
  and `--remove-orphans` exist. [V — https://docs.docker.com/reference/cli/docker/compose/up/]
- SSH from Actions: `appleboy/ssh-action` is MIT [V — `gh api repos/appleboy/ssh-action`], or plain `ssh` with a key from
  a secret; also `DOCKER_HOST=ssh://user@host` lets the runner drive the remote daemon directly [U — https://docs.docker.com/engine/security/protect-access/].

Pros: reproducible immutable images, rollback = previous tag, VM stays small, build CPU not on prod.
Cons: needs a registry and image tags in compose (`image: ghcr.io/...:${TAG}`); pull bandwidth to Dakar (slim the runtime stage).

## Option (b) — build on the server

Flow: SSH, `git pull`, `docker compose up -d --build`.

- Simplest wiring; the current `docker-compose.yml` already does this.
- Bun install + Vite build runs on the prod VM: CPU/RAM spike during deploy, and a failed build happens on prod.
- Secrets (`apps/*/.env`) must live on the VM for the BuildKit mounts (they must anyway for runtime).
- Rollback = `git checkout <old-sha>` + rebuild (slow, and not guaranteed identical — floating `oven/bun:1` base tag).
- Needs a repo deploy key on the server.

## Option (c) — dedicated tools (licences checked via GitHub API, `license.spdx_id`)

| Tool | Licence | Fit |
|---|---|---|
| Kamal (`basecamp/kamal`) | MIT [V] | Builds/pushes images, deploys over SSH, zero-downtime via `kamal-proxy` (MIT [V]), `kamal rollback <version>`, secrets via `.kamal/secrets`, "accessories" for Postgres. [U — https://kamal-deploy.org/docs/] Kamal-proxy terminates TLS itself, so Caddy becomes redundant or must sit behind/beside it. Multi-app monorepo = one `deploy.yml` per service (destinations). Ruby gem (or its Docker image) in CI. |
| Coolify (`coollabsio/coolify`) | Apache-2.0 [V] | Self-hosted PaaS with web UI, uses its own Traefik/Caddy proxy; heavy (own Postgres/Redis) on a small VM; deploys via webhook. [U — https://coolify.io/docs] |
| Dokploy (`Dokploy/dokploy`) | GitHub reports `NOASSERTION`; `LICENSE.MD` = Apache-2.0 **except** anything under `/proprietary`, which is under `LICENSE_PROPRIETARY` [V — https://github.com/Dokploy/dokploy/blob/canary/LICENSE.MD] | Licence-wise allowed (no GPL family) but mixed; Traefik-based; Docker Swarm under the hood. [U] |

None of the three are GPL/AGPL/LGPL [V]. Caddy is Apache-2.0 [V]. Coolify/Dokploy add an always-on control plane on
the same VM and their own reverse proxy, overlapping with the already-chosen Caddy.

## Cross-cutting concerns

### Secrets
- CI: GitHub Actions encrypted secrets / environment secrets (`environment: production` gives an approval gate). [U — https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions]
- VM: keep `/opt/codesphere/.env` (mode 600, owned by deploy user) referenced via `env_file:`; never in the repo (map constraint).
  Optionally the workflow writes it from secrets on each deploy so GitHub is the single source of truth.
- Build-time: `VITE_SERVER_URL` is public by nature (ends up in client JS) — pass as a build arg, not a secret.
- Compose also supports `secrets:` mounted as files at runtime (`/run/secrets/<name>`) [U — https://docs.docker.com/compose/how-tos/use-secrets/], but the app reads env vars, so `env_file` is simpler.

### Migrations before start
- Ephemeral `migrate` service using the `server` image (`command: bun run db:migrate` or equivalent), `restart: "no"`,
  `depends_on: postgres: condition: service_healthy`; `server` declares
  `depends_on: migrate: condition: service_completed_successfully`. [U — https://docs.docker.com/compose/how-tos/startup-order/]
- Or explicitly in the deploy script: `docker compose run --rm migrate` then `up -d --wait`; a failed migration aborts before swapping.
- Migrations must be backward-compatible (expand/contract) so the old image can still run if we roll back.
- Take a `pg_dump` before migrating (cheap insurance).

### Rollback
- (a): tag images with the git SHA; compose uses `image: ghcr.io/...:${TAG}`; write the deployed TAG to a file on the VM.
  Rollback = re-run deploy with previous SHA (`workflow_dispatch` input). Also keep `:previous` locally so it works without GHCR.
- DB rollbacks are not automatic; rely on backward-compatible migrations + the pre-deploy dump.
- Kamal: built-in `kamal rollback`. [U]

### Domain + HTTPS with Caddy
- Caddy obtains and renews certificates automatically when the site address is a domain and ports 80/443 are reachable
  and DNS points to the VM. [U — https://caddyserver.com/docs/automatic-https]
- Persist `/data` (certs, ACME account) in a named volume, or restarts may hit Let's Encrypt rate limits. [U — https://hub.docker.com/_/caddy]
- Sketch: `codesphere.example { reverse_proxy /api/* server:3000; reverse_proxy web:3001 }` (or `api.` subdomain);
  only Caddy publishes ports; `web`, `server`, `postgres` stay on the internal network.
- Check that Systalink's firewall/security group opens 80/443 (TCP and UDP 443 for HTTP/3). [U — Systalink docs not consulted]

### Downtime
- `docker compose up` "picks up the changes by stopping and recreating the containers" — expect a few seconds of 502 per
  service while the new container starts and passes its healthcheck. [V — https://docs.docker.com/reference/cli/docker/compose/up/]
- Mitigations: pre-pull before `up` (removes download time from the outage); Caddy `lb_try_duration` to retry upstream
  during the restart window [U — https://caddyserver.com/docs/caddyfile/directives/reverse_proxy]; true zero-downtime needs
  blue/green (two service names + Caddy upstream switch) or Kamal-proxy. For a hackathon demo, seconds of downtime are acceptable.

## Recommendation (solo dev, ~3 weeks)

**Option (a): GHCR images + SSH `compose pull && run migrate && up -d --wait`.**
- It reuses the existing Dockerfiles and the decided Caddy + ephemeral migration service; no new control plane, all MIT/Apache tooling.
- One workflow: on push to `main` after CI passes → build/push `web` and `server` tagged with SHA → SSH: write TAG, `pull`,
  `pg_dump`, `run --rm migrate`, `up -d --wait --remove-orphans`, curl health check; `workflow_dispatch` with a `tag` input for rollback.
- Accept a few seconds of downtime; add `lb_try_duration` in Caddy. Revisit Kamal only if zero-downtime becomes a requirement.
- Skip Coolify/Dokploy: extra moving parts on a single VM, overlapping proxy, and Dokploy's mixed licence would need explaining to the CADEV jury.
- Prep tasks: add `compose.prod.yml` (image tags, no published DB port, Caddy + `/data` volume, migrate service), slim runtime stages, pin the Bun base image.

## Open / unverified points
- Exact GHCR permission wording and `build-push-action` secrets syntax (marked [U]).
- Systalink Cloud Server specifics: OS image, firewall, Docker preinstalled or not, bandwidth to GHCR — not researched.
- Kamal + Caddy coexistence not tested.
