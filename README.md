# Compta Pilot — Plateforme de gestion comptable

Application web Next.js pour cabinets comptables : clients, tâches, assignation, OCR factures, notifications email.

## Prérequis

- Node.js 20+
- npm
- SMTP réel en production (SendGrid, Brevo, Office 365, etc.)

## Docker (SQLite + Mailpit)

SQLite est stocké dans un **volume Docker persistant** (`compta_pilot_data`).

```bash
npm run docker:init    # crée .env.docker depuis l'exemple
# Éditer .env.docker : SESSION_SECRET obligatoire
npm run docker:up      # build + démarrage
```

| Service | URL |
|---------|-----|
| Application | http://localhost:3000 |
| Boîte mail (Mailpit) | http://localhost:8025 |

Première visite → **Configuration du cabinet** (`/setup`).

```bash
npm run docker:logs    # journaux applicatifs
npm run docker:down    # arrêt des conteneurs
```

Données persistantes : base SQLite `/data/compta.db` et fichiers `/data/uploads` dans le volume.

Problème au build (`EOF`) ? Voir **[DOCKER.md](./DOCKER.md)**.

## Production (HTTPS, URL publique)

Pour déployer sur un **VPS avec domaine** et impressionner en démo réelle : **[DEPLOY.md](./DEPLOY.md)**.

```bash
npm run prod:init   # crée .env.production
# Éditer DOMAIN, APP_URL, SESSION_SECRET, MAILER_DSN (Brevo)
npm run prod:up     # sur un serveur Linux avec ports 80/443
```

## Installation locale (sans Docker)

```bash
cd plateforme-compta
npm install
cp .env.example .env
# Éditer .env : SESSION_SECRET, APP_URL, SMTP…
npm run db:push
npm run build
npm run start
```

Ouvrir `APP_URL` (ex. http://localhost:3000) → **Configuration du cabinet** : créez le compte dirigeant (aucune donnée fictive).

Ensuite : **Équipe** → ajoutez vos collaborateurs avec leurs vrais emails.

## Développement local

```bash
npm run dev
```

Sans `SESSION_SECRET` ni SMTP, l'app fonctionne en mode dev (emails loggés dans la console).

### Données de démo (optionnel)

```bash
SEED_DEMO=true npm run db:seed
```

Comptes : `directeur@cabinet.fr` / `demo123` — **ne pas utiliser en production**.

## Variables d'environnement

| Variable | Production | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Oui | SQLite (`file:./prisma/dev.db` ou `file:/data/compta.db` sous Docker) |
| `UPLOADS_DIR` | Non | Dossier des documents (Docker : `/data/uploads`) |
| `SESSION_SECRET` | **Oui** | Secret sessions signées (32+ car.) |
| `APP_URL` | **Oui** | URL publique HTTPS |
| `EMAIL_FROM` | **Oui** | Expéditeur emails |
| `MAILER_DSN` ou `SMTP_*` | **Oui** | Envoi email réel |
| `SEED_DEMO` | Non | `true` = données fictives |

## Dossier de présentation (stage / patron)

Documentation complète dans **[docs/](./docs/)** :

| Document | Contenu |
|----------|---------|
| [01-PRESENTATION-PROJET.md](./docs/01-PRESENTATION-PROJET.md) | Présentation détaillée, travail réalisé, reste à faire |
| [02-FICHE-COMMERCIALE.md](./docs/02-FICHE-COMMERCIALE.md) | Fiche 1 page pour le dirigeant |
| [03-SCENARIO-DEMO.md](./docs/03-SCENARIO-DEMO.md) | Script démo 15 minutes |
| [04-RAPPORT-STAGE.md](./docs/04-RAPPORT-STAGE.md) | Rapport de stage |
| [05-ANALYSE-CONCURRENTIELLE.md](./docs/05-ANALYSE-CONCURRENTIELLE.md) | Comparatif marché |
| [06-ROADMAP.md](./docs/06-ROADMAP.md) | Roadmap phases 1–3 |
| [DOSSIER-COMPLET.html](./docs/DOSSIER-COMPLET.html) | **PDF** : ouvrir → Ctrl+P → Enregistrer en PDF |

## Fonctionnalités

- Dashboard, clients, tâches, assignation intelligente
- Obligations automatiques + TVA mensuelle portefeuille
- Documents + OCR (images, PDF texte, PDF scannés)
- Notifications in-app + **emails SMTP**
- Scoring collaborateurs, validation workflow
- Comptes utilisateurs réels (setup + gestion équipe)

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run db:push` | Schéma base de données |
| `SEED_DEMO=true npm run db:seed` | Démo uniquement |
| `npm run docker:up` | Lancer avec Docker Compose |
| `npm run docker:down` | Arrêter Docker |

## Sécurité production

- HTTPS obligatoire (`secure` cookie activé en production)
- Cookies de session **signés** (HMAC)
- Mots de passe bcrypt (12 rounds)
- Pas de comptes ni emails simulés par défaut
