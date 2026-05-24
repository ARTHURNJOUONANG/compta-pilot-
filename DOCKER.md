# Docker — Compta Pilot

## Demarrage rapide

```powershell
cd plateforme-compta
npm run docker:init
# Editer .env.docker : SESSION_SECRET (32+ caracteres)

npm run docker:up
# ou : .\scripts\docker-up.ps1
```

- **App** : http://localhost:3000
- **Mailpit** (optionnel) : `docker compose --profile mail up -d` → http://localhost:8025

## SQLite sous Docker

| Donnee | Chemin conteneur | Volume |
|--------|------------------|--------|
| Base SQLite | `/data/compta.db` | `compta_pilot_data` |
| Documents | `/data/uploads` | meme volume |

## Erreur `EOF` au build (Windows)

Souvent lie a **Docker Desktop** pas pret ou BuildKit instable.

1. Ouvrir **Docker Desktop** → attendre « Engine running »
2. **Restart** Docker Desktop
3. Relancer : `npm run docker:up`

Si ca persiste :

```powershell
$env:COMPOSE_BAKE = "false"
docker compose build app
```

Alternative sans Docker :

```powershell
npm run db:push
npm run dev
```

## Commandes utiles

```powershell
npm run docker:logs    # journaux
npm run docker:down    # arret
docker compose down -v # supprimer les donnees
```
