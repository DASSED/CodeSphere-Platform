# Déploiement de CodeSphere

Production sur `codesphereplatform.xyz`, préproduction sur `staging.codesphereplatform.xyz`, toutes deux sur le Cloud Server Systalink (Dakar). Décisions : voir la carte « Livraison de CodeSphere ».

## Fichiers

- `edge/compose.yml` + `edge/Caddyfile` : Caddy unique, HTTPS et en-têtes de sécurité, une origine par environnement.
- `compose.app.yml` : un environnement (migration, server, web, Postgres), images GHCR étiquetées par le SHA git.
- `deploy.sh` : pull, sauvegarde de la base, migration, démarrage, contrôle de santé.
- `backup.sh` : sauvegarde d'un environnement dans `~/backups` (14 jours), puis signal healthchecks.io ; lancé par `deploy.sh` et chaque nuit par `cron`.
- `monitor.sh` : alerte Telegram si le disque dépasse 80 % ou la mémoire 90 % ; lancé toutes les 15 min par `cron`, configuré par `.env.monitor` (modèle `.env.monitor.example`).
- `.env.example` : modèle des fichiers `.env.staging` et `.env.production` (sur le serveur seulement, `chmod 600`).
- `../.github/workflows/deploy.yml` : `main` → build + préproduction automatique ; production en poussant une étiquette `vX.Y.Z` sur un commit de `main` déjà déployé en préproduction (réutilise son image, crée la Release GitHub avec notes générées, catégories dans `../.github/release.yml`). Retour arrière : relancer le workflow de l'étiquette précédente.

## Checklist de mise en place (une fois, par un membre de l'équipe)

1. Créer le compte sur platform.systalink.com, commander un Cloud Server **Business, Dakar** (Linux), appliquer le code promo CADEV.
2. Acheter `codesphereplatform.xyz` ; créer les enregistrements DNS `A` pour `codesphereplatform.xyz` et `staging.codesphereplatform.xyz` vers l'IP du serveur.
3. Sur le serveur : installer Docker et le plugin Compose ; créer l'utilisateur `deploy` (sans sudo) membre du groupe `docker` ; autoriser sa clé SSH publique.
4. Cloner le dépôt dans `~/codesphere` (lecture seule suffit) ; `docker login ghcr.io` avec un jeton en lecture des paquets.
5. `docker network create edge` puis `docker compose -f deploy/edge/compose.yml up -d`.
6. Créer `deploy/.env.staging` et `deploy/.env.production` à partir de `.env.example` (`chmod 600`).
7. Dans GitHub : secrets `DEPLOY_HOST` et `DEPLOY_SSH_KEY` (clé privée de `deploy`) ; environnements `staging` et `production` (relecture requise pour `production`).
8. Supervision (décisions : ticket « Grilling : supervision, alertes et logs en production ») :
   - créer un groupe Telegram d'équipe et un bot (@BotFather), l'ajouter au groupe ; renseigner `deploy/.env.monitor` (`chmod 600`) ;
   - healthchecks.io (gratuit) : un contrôle par environnement, période 1 jour, tolérance 2 h, alertes vers Telegram + e-mail ; copier l'URL de ping dans `BACKUP_HEARTBEAT_URL` de chaque `.env.<env>` ;
   - UptimeRobot (gratuit) : sondes HTTP 5 min sur `https://codesphereplatform.xyz/health` et `https://staging.codesphereplatform.xyz/health`, alertes vers Telegram + e-mail ;
   - copie hors serveur : créer un bucket Cloudflare R2 (offre gratuite 10 Go) et une clé d'API limitée à ce bucket ; installer `rclone` (licence MIT) ; `rclone config` → un remote `r2` (S3, fournisseur Cloudflare) puis un remote `codesphere-offsite` de type `crypt` par-dessus `r2:codesphere-backups` (mots de passe conservés hors serveur, dans le gestionnaire de mots de passe de l'équipe) ; `OFFSITE_REMOTE=codesphere-offsite:` dans chaque `.env.<env>` ; tester une restauration depuis R2 au moins une fois ;
   - `crontab -e` de l'utilisateur `deploy` :
     ```
     */15 * * * * ~/codesphere/deploy/monitor.sh
     0 2 * * *   ~/codesphere/deploy/backup.sh production
     30 2 * * *  ~/codesphere/deploy/backup.sh staging
     ```
9. Fusionner sur `main` et vérifier `https://staging.codesphereplatform.xyz/health`.

## Avant la démo CADEV (24 oct.)

Faire une sauvegarde de production, vérifier sa présence sur R2, et en rapatrier une copie sur la machine du capitaine :
`scp deploy@<ip>:~/backups/codesphere-production-<date>.sql.gz ~/codesphere-backups/`, puis la restaurer dans une base locale pour s'assurer qu'elle est exploitable.

## Logs

Rotation par Docker (`json-file`, 5 fichiers de 10 Mo par conteneur). Consultation en SSH : `docker compose -p codesphere-production logs -f --since 1h server`.

## Points non vérifiés

- Le build des images en CI sans fichiers `.env` réels (contrôle varlock au build) ; `VITE_SERVER_URL` est fixé à la préproduction, à rendre relatif (même origine) avant la production.
- `drizzle-kit migrate` dans l'image server (dépendance présente via le monorepo copié).
- Les routes `/health` et `/ready` du serveur ne sont pas encore implémentées ; le contrôle de santé utilise `/`. Les sondes UptimeRobot visent `/health` : à créer après son implémentation (ou viser `/` en attendant).
- Les spécificités de la VM Systalink (image Linux, pare-feu, accès root initial).
