# Compta Pilot — Dossier de livraison

**Projet :** Plateforme de gestion comptable (Next.js + Capacitor Android)  
**Date :** Mai 2026  
**Auteur :** Arthur NJOUONANG

---

## Liens essentiels

| Ressource | URL |
|-----------|-----|
| **Application web (production)** | https://compta-pilot.vercel.app |
| **Dépôt GitHub** | https://github.com/ARTHURNJOUONANG/compta-pilot- |
| **Santé API** | https://compta-pilot.vercel.app/api/health |
| **Connexion** | https://compta-pilot.vercel.app/login |
| **Première config** | https://compta-pilot.vercel.app/setup |

---

## Contenu livré

### Application web

- Dashboard, clients, tâches, coffre-fort documentaire (OCR), contrats, équipe, notifications, rapport
- Authentification sécurisée (session signée, rôles dirigeant / manager / collaborateur)
- Export CSV (tâches en retard, inventaire documents)
- Déployée sur **Vercel** (HTTPS)

### Application mobile (atelier Capacitor)

- Pipeline **Partie A** : build Docker local → `npm run mobile:build`
- Pipeline **Partie B** : GitHub Actions → workflow `.github/workflows/build-android.yml`
- APK = WebView Capacitor pointant vers l’URL Vercel (`/login`)
- Guide : [MOBILE-ANDROID.md](./MOBILE-ANDROID.md)

### Documentation

| Document | Contenu |
|----------|---------|
| [01-PRESENTATION-PROJET.md](./01-PRESENTATION-PROJET.md) | Présentation métier |
| [03-SCENARIO-DEMO.md](./03-SCENARIO-DEMO.md) | Script démo 15 min |
| [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) | Variables Vercel |
| [MOBILE-ANDROID.md](./MOBILE-ANDROID.md) | APK Android |
| [07-USER-STORIES.md](./07-USER-STORIES.md) | User stories |

---

## Démarrage rapide (correcteur / jury)

### 1. Vérifier que l’app tourne

Ouvrir : https://compta-pilot.vercel.app/api/health

Réponse attendue :

```json
{ "status": "ok", "database": "connected", "schema": "complete" }
```

### 2. Créer le compte dirigeant (si base vide)

1. https://compta-pilot.vercel.app/setup
2. Nom, email, mot de passe (8 caractères min.)
3. Redirection automatique vers le tableau de bord

> La base SQLite sur Vercel est **éphémère** : après un redéploiement, recréer le compte via `/setup`.

### 3. Parcours de démo (5 min)

1. **Dashboard** — vue d’ensemble retards / charge
2. **Clients → Nouveau client** — générer les obligations TVA
3. **Coffre-fort** — déposer un PDF facture (OCR)
4. **Tâches** — assigner, changer le statut
5. **Rapport** — synthèse + export CSV
6. **Contrats** — créer une lettre de mission

Scénario détaillé : [03-SCENARIO-DEMO.md](./03-SCENARIO-DEMO.md)

---

## Livrables atelier Keyce (Capacitor)

| Livrable | Comment l’obtenir |
|----------|-------------------|
| Build Docker réussi | `npm run mobile:build` (Docker Desktop requis) |
| Build CI réussi | GitHub → Actions → **Build Android APK** |
| APK installé | Artefact GitHub Actions ou `generated/builds/apk/app-debug.apk` |
| Capture terminal Docker | Screenshot après build réussi |
| Capture GitHub Actions | Screenshot workflow vert + artefact |

---

## Variables Vercel (production)

Configurer dans **Vercel → Settings → Environment Variables** :

```
SESSION_SECRET=<clé-aléatoire-longue>
APP_URL=https://compta-pilot.vercel.app
DATABASE_URL=file:/tmp/compta.db
UPLOADS_DIR=/tmp/uploads
```

SMTP (optionnel — emails désactivés si absent) :

```
EMAIL_FROM=Compta Pilot <email@domaine.com>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

**Node.js :** recommander **20.x** (Project Settings → General).

---

## Installation locale ( développeur )

```bash
git clone https://github.com/ARTHURNJOUONANG/compta-pilot-.git
cd compta-pilot-
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Ouvrir http://localhost:3000/setup

---

## Limites connues (à mentionner en soutenance)

1. **Vercel + SQLite** : données réinitialisées à chaque déploiement → démo ou PostgreSQL en prod réelle
2. **Fichiers uploadés** : stockés dans `/tmp` sur Vercel → non persistants entre redéploiements
3. **APK mobile** : charge l’app web (nécessite connexion internet)
4. **OCR** : précision variable selon la qualité du scan

---

## Checklist avant remise

- [ ] Production Vercel sur le commit **`main` le plus récent** (pas un ancien redeploy)
- [ ] `/api/health` → `"status":"ok"`
- [ ] Compte dirigeant créé et connexion `/login` OK
- [ ] Création client + dépôt document testés
- [ ] Export CSV fonctionnel
- [ ] (Optionnel) APK Android buildé ou artefact GitHub Actions
- [ ] Dépôt GitHub public ou accessible au correcteur

---

## Contact & support

- **GitHub Issues** : https://github.com/ARTHURNJOUONANG/compta-pilot-/issues
- **Documentation complète** : dossier `docs/`
