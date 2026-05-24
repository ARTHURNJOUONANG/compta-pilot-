#!/bin/sh
set -e

mkdir -p /data/uploads

export DATABASE_URL="${DATABASE_URL:-file:/data/compta.db}"

echo "→ Synchronisation SQLite (Prisma)…"
npx prisma db push --skip-generate

echo "→ Démarrage Compta Pilot sur http://0.0.0.0:3000 …"
exec npm run start
