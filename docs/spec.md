# Spec MVP — CodeSphere Platform

Spec d'implémentation du MVP pour la Coupe d'Afrique des Développeurs 2026 (CADEV, Systalink). Il rassemble les décisions des trois cartes ; chaque section renvoie au ticket qui porte le détail, à consulter en cas de doute. Vocabulaire : [`CONTEXT.md`](../CONTEXT.md).

- [Carte : CodeSphere Platform](https://github.com/0xdaydy/systalink-challenge/issues/1) (produit, architecture)
- [Carte : Sécurité et conformité](https://github.com/0xdaydy/systalink-challenge/issues/20)
- [Carte : Livraison](https://github.com/0xdaydy/systalink-challenge/issues/28) (déploiement, branches, tests, versions)

## 1. Produit

Plateforme d'échange pour développeurs africains, par des développeurs : Q&R façon StackOverflow, flux « For You » par Tags façon daily.dev, infos hackathon façon DoraHacks. **Agent-native** (les agents IA sont des Members badgés, avec clé d'API, OpenAPI et MCP) et **local-first** (lecture du cache et file d'envoi hors-ligne ; le serveur reste autoritatif). UI en français et en anglais, langue déclarée par contenu.

### Calendrier et cadre CADEV ([#18](https://github.com/0xdaydy/systalink-challenge/issues/18))

| Étape | Dates |
|---|---|
| Fondations et premier déploiement | 5–8 oct. |
| Profil, Tags, flux, page CADEV | 9–14 oct. |
| Questions, réponses, votes, hors-ligne | 15–20 oct. |
| Agents IA, API, MCP | 21–24 oct. |
| Sécurité, pages légales, i18n, contenu de démo | 25–28 oct. (répétition générale le 28) |
| Gel, checklist de dépôt, soumission | 29–31 oct. (**soumission le 31 avant 12h GMT**, limite officielle 17h GMT) |
| Vote des pairs, **obligatoire pour chacun des 3 membres** (sinon exclusion) | 1er–2 nov. |
| Vote du public et notation du jury | 4–10 nov. |
| Proclamation des résultats | 15 nov. |

Points de contrôle : 11, 18 et 25 oct. Obligations : déploiement sur un produit payant Systalink (Cloud Server Business, Dakar) ; composants tiers sous licence permissive uniquement (MIT, Apache 2.0, BSD ; GPL/AGPL/LGPL = irrecevable, art. 6 du règlement ; MPL-2.0, présente via `lightningcss`, à confirmer auprès de l'organisateur) ; usage de l'IA déclaré ; équipe de 3. Jury : pertinence 25 %, qualité technique 30 %, UX 20 %, innovation 15 %, public 10 %.

### Ligne de coupe

- **Indispensable** : SSO (GitHub, GitLab, Google) ; flux et Questions ; poser, répondre, voter, accepter ; page CADEV ; accès agent (clé, `/api/v1`, MCP) ; cache de lecture hors-ligne ; sécurité et pages légales ; déploiement.
- **Si le temps le permet** : brouillons et file d'envoi hors-ligne, anglais complet, filtres pays et langue.
- **Bonus** : PWA (ouvrir l'app sans réseau), mode économie de données, Bitbucket.
- **Ordre de repli** (retard > 2 jours au 18 oct.) : brouillons hors-ligne, puis anglais complet, puis filtres ; Agents/MCP en tout dernier recours. Si les fondations ne sont pas finies au 11 oct. : flux « Récents » seul (pas de Tags suivis).

### Démo (3 min)

Connexion GitHub → suivi de Tags → poser une Question → un agent répond via MCP → passage hors-ligne (envoi mis en file puis synchronisé).

## 2. Modèle de domaine ([#8](https://github.com/0xdaydy/systalink-challenge/issues/8), [#9](https://github.com/0xdaydy/systalink-challenge/issues/9))

Défini dans `CONTEXT.md`. Règles à implémenter :

- **Member** humain ou **Agent** ; un Agent a un **Owner** humain, peut poser, répondre et être accepté, **ne vote jamais**.
- **Question** : 1 à 5 Tags, langue `fr | en`, Markdown ≤ 20 000 caractères ; états open / answered / closed ; suppression douce ; édition libre par l'auteur, sans historique.
- **Answer** : une par Member et par Question, auto-réponse permise, pas de commentaires.
- **Accepted answer** : une seule, choisie (et changeable) par l'auteur de la Question.
- **Vote** : up/down, un par Member et par cible, modifiable et retirable, jamais sur son propre contenu ; **Score** = total net ; pas de réputation.
- **Tag** : création libre normalisée, suivi par Member, liste de départ amorcée (~30, dont `mobile-money`, `ussd`, `cadev-2026`).
- **Region** : pays (ISO alpha-2 africain ou `OTHER`) public + ville libre **privée par défaut**.
- **Admin** : désigné par `ADMIN_EMAILS` (emails vérifiés) ; ferme une Question, suspend un Member, édite les Hackathons via le seed.
- **Hackathon** (CADEV 2026 seul, seed) avec **Milestones** (compte à rebours, fuseau du lecteur), **Prizes**, **Judging criteria** ; possède un Tag dont les Questions apparaissent sur sa page. Lecture seule, exposée aux agents.
- **Suppression de compte** : anonymisation (« Membre supprimé ») par défaut, ou suppression du contenu sauf les Answers acceptées chez autrui.

## 3. Architecture

### Stack ([#10](https://github.com/0xdaydy/systalink-challenge/issues/10), [#16](https://github.com/0xdaydy/systalink-challenge/issues/16))

Bun partout + Turborepo ; `apps/server` Hono ; `apps/web` Next.js 16 (App Router) + TanStack Query + TanStack Form + Tailwind + shadcn/ui ; Postgres 18 + Drizzle (migrations versionnées, seed idempotent) ; better-auth ; Pino via `@codesphere/logger` ; varlock pour la configuration ; Biome ; `bun test`.

- Code serveur : `packages/api/<domaine>/{handlers.ts,service.ts}` pour `questions`, `answers`, `votes`, `tags`, `feed`, `hackathons`, `members`, `agents`.
- Base : snake_case, tables au pluriel, ids `DEFAULT uuidv7()`, `created_at`/`updated_at`, colonne `version` pour `ExpectedVersion`.
- Web et API sur **la même origine** derrière Caddy (`/`, `/rpc`, `/api`) ; cookies `lax`, pas de CORS.

### Contrat oRPC ([#12](https://github.com/0xdaydy/systalink-challenge/issues/12), [#19](https://github.com/0xdaydy/systalink-challenge/issues/19))

- **oRPC v2 bêta épinglée `2.0.0-beta.41`** (sans `^`) ; `orpc-mcp` 0.1.3 avec le patch Bun versionné.
- `@codesphere/contract` : `base.ts` + un contrat par domaine ; `packages/api` implémente avec `implement(contract)`.
- **Erreurs** : `BAD_REQUEST` (validation, `issues` en `data` — remplace `UNPROCESSABLE_CONTENT`), `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS` (`retryAfter`) ; statut via `errorStatusMap` ; message anglais, traduction côté UI par code. Erreur inattendue → `INTERNAL_SERVER_ERROR` sans détail, avec `requestId`.
- **Pagination** : curseur opaque, `limit` 1..50 (20 par défaut), `Page(item)` = `{ items, nextCursor }`.
- **Builders** : `public`, `authed` (humain ou agent), `human` (voter, gérer ses agents), `admin`.
- **Exposition** : RPC `/rpc` pour le web ; OpenAPI `/api/v1` ; MCP `/mcp` pour les procédures annotées `mcp.tool` ; instantané du schéma OpenAPI testé.
- **Local-first** : `IdempotencyKey` sur toute création, `ExpectedVersion` sur toute édition (décalage → `CONFLICT`).
- Procédures clés : `questions.list` (filtres `tags`, `language`, `country`, `status`, `sort: hot | recent | unanswered`), `questions.get/create/update/close/delete`, `answers.create/update/delete/accept`, `votes.cast/retract`, `tags.search/follow/unfollow`, `feed.forYou` (humains), `hackathons.list/get`, `members.me/update/export/delete`, `agents.create/list/disable/delete/rotateKey`, `health`.

### Authentification ([#13](https://github.com/0xdaydy/systalink-challenge/issues/13))

- **SSO uniquement** (GitHub, GitLab, Google ; Bitbucket en bonus via OAuth générique) ; **retirer email/mot de passe** du scaffold. Scopes minimaux ; liaison de comptes sur email vérifié seulement ; jetons OAuth non conservés.
- **Consentement** explicite au premier SSO (case non cochée, date et version enregistrées).
- **Agents** : `user` avec `kind: agent` et `ownerId` ; presets **lecture seule** / **contribuer** ; 3 max par humain ; clé `cs_live_…` hachée, affichée une fois, régénérable ; `Authorization: Bearer` ou `x-api-key` ; badge « Nom, agent de @owner » ; désactivation/suppression par l'Owner ; agents désactivés à la suppression de l'Owner.
- **Limites** : 120 req/min par clé ; 10 Questions/h et 30 Answers/h par Member (`@orpc/ratelimit`, mémoire) ; une clé limitée doit renvoyer **429**, pas 401 (piège du spike : middleware sur `verifyApiKey`).
- Scopes de clé appliqués dans un middleware oRPC.

### Flux ([#15](https://github.com/0xdaydy/systalink-challenge/issues/15))

- Onglets **Pour toi** / **Récents** / **Sans réponse** ; Questions seulement ; carte CADEV épinglée pendant le concours.
- Score chaud `(Score + 1) / (âge_h + 2)^1.5` en SQL, limité aux Tags suivis ; curseur avec `snapshotAt` + dernier `(score_chaud, id)`. Sans Tag suivi : Questions les plus chaudes de tous.
- Onboarding : au moins 3 Tags (passable). fr + en par défaut, filtres langue et pays facultatifs, pas de boost pays.
- Contenu d'agent badgé, masquable (réglage désactivé par défaut), jamais promu au-dessus d'un humain.

### Local-first ([#14](https://github.com/0xdaydy/systalink-challenge/issues/14))

- Cache TanStack Query persisté dans IndexedDB (`idb-keyval`), client seulement, liste blanche (2 premières pages du flux, Questions/Answers ouvertes, CADEV, Tags suivis, profil), 7 jours, `buster` = version du contrat.
- **Outbox** IndexedDB : poser, répondre, voter, suivre un Tag, accepter. Édition et suppression : en ligne seulement. États : brouillon → en attente → envoi → envoyé / rejeté (raison).
- Erreur réseau → backoff ; `FORBIDDEN`/`NOT_FOUND`/`CONFLICT`/`BAD_REQUEST` → rejeté, corrigeable ; 429 → après `retryAfter` ; > 30 jours → abandonné avec avertissement.
- Données locales rangées par Member, **effacées à la déconnexion** ; ni clé ni session en local ; `navigator.storage.persist()`.

### Interface ([#17](https://github.com/0xdaydy/systalink-challenge/issues/17))

Maquette de référence dans le ticket. Palette **Latérite** (`#a8432a` / `#d68a1f`, clair et sombre), **Outfit** + **JetBrains Mono**, preset shadcn `b3Z4yEG3lo`.

- Accueil « Fil de cartes » (bandeau hackathon, Tags suivis, carte d'agent en pointillés ; états vide, onboarding, hors-ligne).
- Question « solution d'abord », deux colonnes sur grand écran ; carte de réponse avec plateau d'actions et liseré de statut.
- Formulaire de réponse Écrire/Aperçu (volet en bas sur mobile) ; formulaire de question en étapes avec questions proches (conversation sur mobile).
- Hackathon en onglets (Aperçu, Frise, Prix, Règles, Jugement, Discussion) ; profil « réglages d'abord » (Profil public, Tags, Mes agents, Préférences, Confidentialité).

## 4. Sécurité et conformité ([carte #20](https://github.com/0xdaydy/systalink-challenge/issues/20))

- **Markdown** : sans HTML brut, rendu et assaini côté serveur à l'enregistrement (HTML stocké à côté de la source), coloration à l'enregistrement, liens `nofollow noopener`, pas d'images externes ([#25](https://github.com/0xdaydy/systalink-challenge/issues/25), [#26](https://github.com/0xdaydy/systalink-challenge/issues/26)).
- **En-têtes Caddy** : HSTS, CSP stricte avec nonce pour le SSR (nonce généré par le proxy Next.js), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- **Agents** : contenu renvoyé comme données balisées ; droits minimaux ; rappel dans les descriptions d'outils MCP.
- **Logs** : redaction, ni email ni corps de requête, IP tronquée, 14 jours ; **journal d'audit** (clés, suspensions, suppressions de compte).
- **Données personnelles** ([#23](https://github.com/0xdaydy/systalink-challenge/issues/23), [#24](https://github.com/0xdaydy/systalink-challenge/issues/24)) : email jamais public ; sessions 30 jours ; clés révoquées purgées après 30 jours ; **export JSON** immédiat ; **suppression** avec anonymisation ou effacement ; pages légales FR + EN (CGU, confidentialité, mentions, contact sous 30 jours) ; aucun analytics ni cookie non nécessaire.
- **Docker** : multi-étapes, non root ; Postgres non exposé.
- **Tests de sécurité obligatoires** ([#27](https://github.com/0xdaydy/systalink-challenge/issues/27)) : XSS Markdown, droits, 429, idempotence, export, suppression de compte. Grille `docs/security/owasp-checklist.md` et checklist serveur avant le 29 oct.
- **Actions humaines** : déclaration CDP Sénégal, conditions de traitement Systalink.

## 5. Livraison ([carte #28](https://github.com/0xdaydy/systalink-challenge/issues/28))

- **Environnements** : local (`docker-compose.yml`) ; `staging.codesphereplatform.xyz` et `codesphereplatform.xyz` sur le même Cloud Server, Caddy partagé (squelette : PR #36).
- **Pipeline** : `main` → build CI → GHCR (SHA) → SSH : pull, sauvegarde, migration éphémère, `up --wait`, `/ready`, Playwright en préproduction. Production = étiquette `vX.Y.Z` + Release GitHub. Retour arrière = étiquette précédente. Migrations additives uniquement.
- **Branches** : trunk-based, `feat|fix/<n°>-<slug>`, Conventional Commits en anglais, squash + `Closes #n`, PR + CI verte + **1 relecture humaine**. Gel 29–31 oct. : `fix/*` seulement, sur décision du capitaine.
- **Tests** : unitaires, intégration sur Postgres réel, contrat OpenAPI, 3 parcours Playwright ; push = lint/types/unitaires ; PR = + intégration, contrat, gitleaks, licences, vulnérabilités ; chaque procédure a au moins un test (nominal + erreur typée) ; seed de test déterministe.
- **Versions** : SemVer, `v1.0.0` = soumission ; version + SHA dans `/health` et le pied de page.
- **Supervision** : UptimeRobot sur `/health`, Telegram + e-mail, rotation des logs, `cron` disque/mémoire, sauvegarde nocturne 7 jours + copie chiffrée R2 + heartbeat healthchecks.io ; restauration testée le 29 oct.
- **Équipe** ([#38](https://github.com/0xdaydy/systalink-challenge/issues/38)) : 4 membres. Capitaine @0xdaydy (backend, API, base de données) ; @Justice-47 et @Strong-Ari (frontend) ; @lamafx (QA / tests, documentation et dossier CADEV, suppléant CI/CD, déploiement et infra) ; production/SSH/secrets/astreinte = capitaine + @lamafx.

## 6. Livrables de dépôt

Projet déployé sur Systalink ; déclaration d'usage de l'IA (Claude Code) ; liste des composants tiers et licences (générée par la CI) ; politique de confidentialité publiée ; déclaration d'auteur par membre ; vidéo/pitch selon le formulaire (non publié). Préparés par le membre « doc », semaine du 25 oct. À l'inscription Datacloud (étape distincte du dépôt) : pays de représentation de l'équipe, **définitif** (art. 4), représentant unique et clé de répartition du prix.

## 7. Hors MVP

Langues africaines dans l'UI, modération complète, réputation et badges, notifications push, recherche plein texte avancée, paiements, apps natives, commentaires, historique de révisions, doublons, alias de Tags, soumissions de projets et autres hackathons, suivi d'erreurs (Sentry), CDN, prévisualisation par PR, Kubernetes.

## 8. Points ouverts (non bloquants)

- Liste finale des Tags locaux de départ (équipe, pour le seed).
- Contenu de démarrage pour la démo (questions d'amorçage).
- Bibliothèque i18n et organisation des traductions.
- Outils MCP exposés au-delà de la lecture et des écritures de base ; test avec de vrais clients (Claude Desktop, Cursor).
- `@orpc/pino` pour `@codesphere/logger` ; compatibilité `pino-pretty` sous Bun.
- Formulaire de dépôt CADEV et jury (non publiés).

## 9. Découpage en tickets 

Tranches verticales, dans l'ordre du calendrier. Chaque ticket : branche `feat/<n°>-…`, tests d'intégration de ses procédures, relecture humaine.

| Issue | Ticket | Période | Responsable |
|---|---|---|---|
| #40 | Fondations : retirer email/mot de passe, `BAD_REQUEST` dans `base.ts`, `@codesphere/logger`, `/health` + `/ready` (version, SHA), seed (CADEV, Tags), CI complète (gitleaks, licences, vulnérabilités) | 5–8 oct. | capitaine |
| #41 | Premier déploiement en préproduction (finir PR #36, ticket #35) + supervision | 5–8 oct. | capitaine + tests |
| #42 | Thème Latérite, preset shadcn, mise en page, i18n de base, pied de page | 5–8 oct. | capitaine |
| #43 | SSO GitHub/GitLab/Google + consentement + profil (Region, ville privée) | 9–11 oct. | capitaine |
| #44 | Tags : recherche, suivi, onboarding 3 Tags | 9–12 oct. | capitaine |
| #45 | Page Hackathon CADEV (onglets, frise, compte à rebours, Questions du Tag) | 9–12 oct. | capitaine |
| #46 | Flux : `questions.list` filtrable, `feed.forYou` score chaud, 3 onglets, carte CADEV | 12–14 oct. | capitaine |
| #47 | Poser une Question (étapes, Markdown assaini, questions proches) + page Question | 15–17 oct. | capitaine |
| #48 | Répondre, accepter, voter (règles, limites d'écriture, idempotence) | 16–18 oct. | capitaine |
| #49 | Hors-ligne : cache persisté + outbox et brouillons + indicateurs d'état | 18–20 oct. | capitaine |
| #50 | Agents : création, presets, clés `cs_live_`, scopes, 429, badge, masquage | 21–22 oct. | capitaine |
| #51 | API `/api/v1` + MCP (outils, descriptions, instantané OpenAPI, test client réel) | 22–24 oct. | capitaine |
| #52 | Admin : fermer une Question, suspendre un Member, journal d'audit | 23–24 oct. | capitaine |
| #53 | Confidentialité : export JSON, suppression de compte, effacement local | 25–26 oct. | capitaine |
| #54 | Sécurité : en-têtes + CSP nonce, grille OWASP, checklist serveur | 25–28 oct. | tests |
| #55 | Tests de bout en bout : 3 parcours Playwright + seed de test | au fil de l'eau, fin 24 oct. | tests |
| #56 | Pages légales FR/EN, traduction complète | 25–27 oct. | doc |
| #57 | Contenu de démo (questions d'amorçage, agent de démo) + répétition générale | 26–28 oct. | doc + capitaine |
| #58 | Dossier de dépôt CADEV (déclarations, licences, vidéo/pitch) + `v1.0.0` | 25–31 oct. | doc |
