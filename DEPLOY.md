# Mise en production — Compta Pilot

Guide pour déployer une **vraie URL HTTPS** à montrer à votre patron (stage / pilote cabinet).

## Ce que « production » veut dire ici

| Élément | Détail |
|---------|--------|
| URL publique | `https://compta.votrecabinet.fr` (ou sous-domaine) |
| HTTPS | Certificat Let's Encrypt automatique (Caddy) |
| Données | SQLite + uploads dans un volume Docker persistant |
| Emails | SMTP réel (Brevo gratuit recommandé) |
| Sécurité | `SESSION_SECRET` fort, pas de comptes `demo123` en prod |

**Coût typique :** 4–6 €/mois (VPS) + domaine déjà possédé par le cabinet, ou sous-domaine gratuit.

---

## Option A — VPS + Docker + HTTPS (recommandé)

Impression maximale : le patron ouvre le lien depuis son téléphone, partout.

### 1. Créer un serveur

Fournisseurs simples (Ubuntu 22.04 ou 24.04) :

- [Hetzner Cloud](https://www.hetzner.com/cloud) — CX22 (~4 €/mois)
- [OVH VPS](https://www.ovhcloud.com/fr/vps/)
- [Scaleway](https://www.scaleway.com/fr/)

Sur le serveur, installer Docker :

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Se déconnecter/reconnecter en SSH
```

### 2. Nom de domaine

Chez le registrar du cabinet (ou Cloudflare) :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `compta` | IP publique du VPS |

Exemple : `compta.cabinet-dupont.fr` → `51.xxx.xxx.xxx`

Attendre 5–30 min la propagation DNS.

### 3. Envoyer le projet sur le serveur

Depuis votre PC (PowerShell), dans `plateforme-compta` :

```powershell
# Remplacer par l'IP ou le hostname du VPS
scp -r . root@VOTRE_IP:/opt/compta-pilot
```

Ou cloner depuis Git si le projet est sur un dépôt privé.

### 4. Configurer la production

Sur le serveur :

```bash
cd /opt/compta-pilot
cp .env.production.example .env.production
nano .env.production
```

Renseigner obligatoirement :

- `DOMAIN` — ex. `compta.cabinet-dupont.fr`
- `APP_URL` — ex. `https://compta.cabinet-dupont.fr`
- `SESSION_SECRET` — `openssl rand -base64 32`
- `EMAIL_FROM`
- `MAILER_DSN` — voir section **Emails Brevo** ci-dessous

### 5. Démarrer

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Vérifier :

```bash
curl -s https://compta.cabinet-dupont.fr/api/health
# {"status":"ok","service":"compta-pilot",...}
```

### 6. Premier compte

1. Ouvrir `https://votre-domaine/setup`
2. Créer le compte **dirigeant** (email réel du patron si possible)
3. Menu **Équipe** → ajouter 1–2 collaborateurs de test

**Ne pas** laisser `SEED_DEMO=true` en production réelle.

### 7. Pare-feu serveur

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Emails Brevo (gratuit, 5 minutes)

1. Créer un compte sur [brevo.com](https://www.brevo.com)
2. **Paramètres** → **SMTP & API** → générer une clé SMTP
3. Dans `.env.production` :

```env
MAILER_DSN=smtps://VOTRE_EMAIL_LOGIN:VOTRE_CLE_SMTP@smtp-relay.brevo.com:465
EMAIL_FROM=Compta Pilot <noreply@votredomaine.fr>
```

4. Redémarrer : `docker compose -f docker-compose.prod.yml --env-file .env.production up -d`

Tester : assigner une tâche → le collaborateur reçoit l’email.

---

## Option B — Cloudflare Tunnel (sans ouvrir les ports)

Utile si le cabinet a déjà Cloudflare sur son domaine, ou pour tester sans VPS.

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. Créer un tunnel → copier le **token**
3. Lancer l’app en local ou sur un PC du cabinet (`docker compose up`)
4. Installer `cloudflared` et pointer vers `http://localhost:3001`

Documentation : [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

Avantage : HTTPS immédiat. Inconvénient : la machine qui héberge doit rester allumée (sauf VPS + tunnel).

---

## Option C — Démo express (24 h, pas une vraie prod)

Pour un test d’urgence uniquement :

```bash
npx ngrok http 3001
```

Vous obtenez une URL temporaire `https://xxxx.ngrok-free.app`.  
À mentionner au patron : *« C’est un environnement de démonstration temporaire ; la prod sera sur notre domaine. »*

---

## Commandes utiles (serveur)

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f app

# Redémarrage après changement .env
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Sauvegarde base (à planifier)
docker run --rm -v compta_pilot_prod_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/compta-backup-$(date +%F).tar.gz -C /data .
```

---

## Checklist présentation patron

- [ ] URL `https://...` fonctionne sur **téléphone 4G** (pas seulement Wi‑Fi bureau)
- [ ] `/setup` déjà fait — vous vous connectez en dirigeant
- [ ] 2–3 clients et tâches pré-créés (réalistes)
- [ ] Un email de notification reçu sur une vraie boîte mail
- [ ] Upload facture + OCR testé une fois
- [ ] Phrase clé : *« Pilote interne — ne remplace pas Pennylane/Cegid, outil de pilotage »*

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Certificat HTTPS échoue | Vérifier que `DOMAIN` pointe bien vers l’IP du serveur (DNS) |
| App ne démarre pas | `docker compose ... logs app` — souvent SMTP ou `SESSION_SECRET` manquant |
| Cookies / déconnexion | `APP_URL` doit être exactement l’URL HTTPS utilisée |
| Build Docker lent | Normal la 1re fois (OCR / canvas) |

---

## Scripts npm (depuis le projet)

```bash
npm run prod:init    # crée .env.production depuis l'exemple
npm run prod:up      # build + démarrage (machine avec Docker + .env.production rempli)
```

Sur un **VPS Linux**, utilisez les commandes `docker compose` de la section Option A.
