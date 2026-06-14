# Déploiement Vercel — Compta Pilot

## Variables d'environnement obligatoires

| Variable | Exemple |
|----------|---------|
| `SESSION_SECRET` | clé longue aléatoire |
| `APP_URL` | `https://compta-pilot.vercel.app` |
| `DATABASE_URL` | `file:/tmp/compta.db` |
| `UPLOADS_DIR` | `/tmp/uploads` |
| `BLOB_READ_WRITE_TOKEN` | *(recommandé)* token du store **Blob** Vercel — synchronise la base SQLite entre instances |

**Activer Blob (recommandé pour éviter les redirections aléatoires) :**

1. Vercel → **Storage** → **Create Database** → **Blob**
2. Lier le store au projet `compta-pilot`
3. La variable `BLOB_READ_WRITE_TOKEN` est ajoutée automatiquement
4. Redéployer

Sans Blob, chaque instance serverless a sa propre base `/tmp` : navigation instable (retour tableau de bord, `/setup`, etc.).
| `EMAIL_FROM` | `Compta Pilot <votre@email.com>` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | identifiant SMTP Brevo |
| `SMTP_PASS` | clé SMTP Brevo |

**Attention :** le nom doit être exactement `SMTP_HOST` (pas « SMTP Server »).

## Limites SQLite sur Vercel

- La base est dans `/tmp` : **réinitialisée** à chaque redéploiement ou instance froide.
- Convient pour une **démo** ; pour la production, utilisez PostgreSQL (Neon, Supabase) ou Docker (voir `DEPLOY.md`).

## URL de production vs preview

Utilisez l’URL **production** (`https://compta-pilot.vercel.app`), pas les URLs de preview
(`*-arthurnjouonangs-projects.vercel.app`). Les previews peuvent renvoyer **401** sur
`manifest.json` (protection de déploiement Vercel).

## Premier accès

1. Déployer avec les variables ci-dessus.
2. Ouvrir `https://votre-app.vercel.app/setup` pour créer le compte dirigeant.
3. Vérifier `https://votre-app.vercel.app/api/health` → `"database": "connected"` et `"templateDb": true`.

## Après modification du code

Poussez sur GitHub ; Vercel redéploie automatiquement. Sinon : **Deployments → Redeploy**.
