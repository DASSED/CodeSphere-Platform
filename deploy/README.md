# Déploiement de CodeSphere (pile de production)

Une pile Docker Compose sur un seul serveur : Caddy (HTTPS, deux hôtes), le web, le serveur, PostgreSQL 18. Elle remplace le squelette de la branche `chore/35-deploy-skeleton`, dont les pièces opérationnelles (supervision, sauvegarde hors serveur, notes de release, mise en place) sont reprises ici.

## Fichiers

- `../docker-compose.prod.yml` : la pile (caddy, web, migrate, server, postgres). Seul Caddy publie des ports (80, 443).
- `Caddyfile` : deux hôtes, un site. L'hôte public redirige `/admin` vers l'hôte d'administration ; chaque hôte envoie ses chemins d'API (`/api`, `/rpc`, `/mcp`) au serveur et le reste au web.
- `backup.sh` : dump PostgreSQL (format custom, 7 jours), copie hors serveur `rclone` optionnelle, puis signal healthchecks.io. À lancer chaque nuit par `cron`.
- `monitor.sh` : alerte Telegram si le disque dépasse 80 % ou la mémoire 90 %. Toutes les 15 min par `cron`, configuré par `.env.monitor` (modèle `.env.monitor.example`).
- `../.github/release.yml` : catégories des notes de Release GitHub.

## Variables

Dans `.env` à côté de `docker-compose.prod.yml` (jamais commité) :

| Variable | Rôle |
|---|---|
| `PUBLIC_HOST` | hôte public, aussi domaine du cookie de session (ex. `codesphereplatform.xyz`) |
| `ADMIN_HOST` | hôte d'administration (ex. `admin.codesphereplatform.xyz`) |
| `ACME_EMAIL` | contact Let's Encrypt |
| `POSTGRES_PASSWORD` | mot de passe de la base (obligatoire) |
| `APP_VERSION`, `GIT_SHA` | identité du build, rendue par `/health` |

Plus `apps/server/.env` (secrets, identifiants SSO) et `apps/web/.env` (valeurs publiques seulement ; ne pas y mettre `NEXT_PUBLIC_SERVER_URL` : l'image web appelle l'API en même origine).

Pour `backup.sh` : `BACKUP_DIR`, `KEEP_DAYS` (7), `OFFSITE_REMOTE`, `BACKUP_HEARTBEAT_URL`.

## Mise en place (une fois, par un membre de l'équipe)

1. Commander le Cloud Server (Business, Dakar, Linux) sur platform.systalink.com et appliquer le code promo CADEV.
2. Acheter le domaine ; créer les enregistrements DNS `A` de `PUBLIC_HOST` et `ADMIN_HOST` vers l'IP du serveur.
3. Sur le serveur : installer Docker et le plugin Compose ; créer un utilisateur `deploy` (sans sudo) du groupe `docker`.
4. Cloner le dépôt dans `~/codesphere`, créer `.env`, `apps/server/.env` et `apps/web/.env` (`chmod 600`).
5. `docker compose -f docker-compose.prod.yml build` puis `docker compose -f docker-compose.prod.yml up -d --wait`. Le service `migrate` applique le schéma avant le serveur.
6. Vérifier `https://<PUBLIC_HOST>/api/v1/ready`.

## Supervision

- **Telegram** : créer un groupe d'équipe et un bot (@BotFather), l'y ajouter ; renseigner `deploy/.env.monitor` (`chmod 600`).
- **healthchecks.io** : un contrôle, période 1 jour, tolérance 2 h, alertes Telegram et e-mail ; son URL de ping va dans `BACKUP_HEARTBEAT_URL`.
- **UptimeRobot** : sonde HTTP toutes les 5 min sur `https://<PUBLIC_HOST>/api/v1/health`, alertes Telegram et e-mail.
- **Copie hors serveur** : bucket Cloudflare R2 et une clé d'API limitée à ce bucket ; `rclone` (MIT), un remote `r2` (S3, fournisseur Cloudflare) puis un remote `crypt` par-dessus ; mots de passe conservés hors serveur. `OFFSITE_REMOTE=<remote>:`. Tester une restauration depuis R2 au moins une fois.
- **`crontab -e`** de `deploy` :

  ```
  */15 * * * * ~/codesphere/deploy/monitor.sh
  17 3 * * *   cd ~/codesphere && deploy/backup.sh >> /var/log/codesphere-backup.log 2>&1
  ```

## Avant la démo CADEV (29 oct., début du gel)

Faire une sauvegarde, vérifier sa présence sur R2, en rapatrier une copie et la restaurer dans une base locale (`pg_restore`, voir l'en-tête de `backup.sh`) pour s'assurer qu'elle est exploitable.

## Logs

Rotation par Docker (`json-file`, 5 fichiers de 10 Mo par conteneur). En SSH : `docker compose -f docker-compose.prod.yml logs -f --since 1h server`.

## Non repris de `chore/35-deploy-skeleton`

Volontairement laissé de côté, à rouvrir si le besoin apparaît :

- `deploy.yml` (build des images en CI vers GHCR, préproduction automatique, production sur étiquette `vX.Y.Z`) et `deploy.sh` : cette pile se construit sur le serveur ; un déploiement piloté par la CI suppose des images publiées et un accès SSH, qui n'existent pas encore.
- Une préproduction sur le même serveur (`compose.app.yml` par environnement) : le staging tourne aujourd'hui sur Cloudflare Workers (`staging.yml`).
- Le renommage du produit dans `CONTEXT.md` (« CodeSphere Platform »), à décider à part.

## Points non vérifiés

- Le build des images sur un serveur réel (les secrets de build sont montés depuis `apps/*/.env`).
- `drizzle-kit migrate` dans l'image server (dépendance présente via le monorepo copié).
- L'exécution de `backup.sh` contre une vraie base, et de la copie `rclone`.
- Les spécificités de la VM Systalink (image Linux, pare-feu, accès root initial).
