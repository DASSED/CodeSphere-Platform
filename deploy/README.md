# Déploiement de CodeSphere

Production sur `codesphereplatform.xyz`, préproduction sur `staging.codesphereplatform.xyz`, toutes deux sur le Cloud Server Systalink (Dakar). Décisions : voir la carte « Livraison de CodeSphere ».

## Fichiers

- `edge/compose.yml` + `edge/Caddyfile` : Caddy unique, HTTPS et en-têtes de sécurité, une origine par environnement.
- `compose.app.yml` : un environnement (migration, server, web, Postgres), images GHCR étiquetées par le SHA git.
- `deploy.sh` : pull, sauvegarde de la base, migration, démarrage, contrôle de santé.
- `.env.example` : modèle des fichiers `.env.staging` et `.env.production` (sur le serveur seulement, `chmod 600`).
- `../.github/workflows/deploy.yml` : `main` → build + préproduction automatique ; production manuelle (« Run workflow » + SHA).

## Checklist de mise en place (une fois, par un membre de l'équipe)

1. Créer le compte sur platform.systalink.com, commander un Cloud Server **Business, Dakar** (Linux), appliquer le code promo CADEV.
2. Acheter `codesphereplatform.xyz` ; créer les enregistrements DNS `A` pour `codesphereplatform.xyz` et `staging.codesphereplatform.xyz` vers l'IP du serveur.
3. Sur le serveur : installer Docker et le plugin Compose ; créer l'utilisateur `deploy` (sans sudo) membre du groupe `docker` ; autoriser sa clé SSH publique.
4. Cloner le dépôt dans `~/codesphere` (lecture seule suffit) ; `docker login ghcr.io` avec un jeton en lecture des paquets.
5. `docker network create edge` puis `docker compose -f deploy/edge/compose.yml up -d`.
6. Créer `deploy/.env.staging` et `deploy/.env.production` à partir de `.env.example` (`chmod 600`).
7. Dans GitHub : secrets `DEPLOY_HOST` et `DEPLOY_SSH_KEY` (clé privée de `deploy`) ; environnements `staging` et `production` (relecture requise pour `production`).
8. Fusionner sur `main` et vérifier `https://staging.codesphereplatform.xyz/health`.

## Points non vérifiés

- Le build des images en CI sans fichiers `.env` réels (contrôle varlock au build) ; `VITE_SERVER_URL` est fixé à la préproduction, à rendre relatif (même origine) avant la production.
- `drizzle-kit migrate` dans l'image server (dépendance présente via le monorepo copié).
- Les routes `/health` et `/ready` du serveur ne sont pas encore implémentées ; le contrôle de santé utilise `/`.
- Les spécificités de la VM Systalink (image Linux, pare-feu, accès root initial).
