# Compta Pilot — Présentation détaillée du projet

**Plateforme intelligente de gestion et pilotage pour cabinets comptables**  
*Document de présentation — Stage / direction de cabinet*  
*Version : MVP — Mai 2026*

---

## 1. Résumé exécutif

**Compta Pilot** est une application web conçue pour les **cabinets comptables de 3 à 15 collaborateurs** qui perdent en visibilité sur les dossiers, les échéances et la charge de travail.

Ce n’est **pas** un logiciel de comptabilité réglementée (remplacement de Pennylane, Cegid, Sage). C’est un **outil de pilotage organisationnel** : qui fait quoi, quoi est en retard, qui valide, où sont les documents.

| Indicateur | Objectif visé |
|------------|---------------|
| Gain de temps organisationnel | 30 à 50 % sur le suivi et la coordination |
| Réduction des oublis | Obligations générées automatiquement + alertes |
| Visibilité dirigeant | Tableau de bord + validation mobile |
| Traçabilité | Workflow exécution → contrôle → validation |

---

## 2. Problématique métier

### 2.1 Constats dans un cabinet type

- Le **dirigeant** ne sait pas en temps réel quels dossiers sont en retard.
- Les **collaborateurs** sont surchargés ou sous-utilisés sans vision centralisée.
- Les **échéances** (TVA, URSSAF, bilan) sont suivies dans Excel, emails ou papier.
- Les **documents clients** (factures) arrivent par email ; la saisie est manuelle.
- Les **validations** passent par des appels et des relances informelles.
- **Aucun score** de fiabilité pour orienter la délégation des tâches sensibles.

### 2.2 Conséquences

- Stress en période fiscale.
- Risque d’erreurs et d’oublis.
- Temps perdu en coordination (appels, mails « où en est-on ? »).
- Image cabinet dégradée si un client est traité en retard sans que le dirigeant le sache.

### 2.3 Réponse apportée par Compta Pilot

Une **plateforme unique** qui centralise clients, tâches, documents, notifications et pilotage équipe — accessible sur **ordinateur et mobile** (interface responsive + PWA).

---

## 3. Positionnement et plus-value

### 3.1 Ce que fait Compta Pilot

| Domaine | Fonctionnalité |
|---------|----------------|
| **Pilotage** | Dashboard : retards, urgences, charge par collaborateur |
| **Clients** | Fiche dossier, historique tâches, documents |
| **Tâches** | Création, priorités, échéances, statuts, assignation |
| **Intelligence organisationnelle** | Suggestion d’assignation (charge + score fiabilité) |
| **Obligations FR** | TVA, URSSAF, bilan, liasse générés à la création client |
| **Workflow qualité** | Exécution → demande validation → approbation dirigeant |
| **Documents** | Upload, classement, OCR factures (montant, date, SIRET…) |
| **Alertes** | Notifications in-app + emails SMTP |
| **Équipe** | Rôles dirigeant / manager / collaborateur, scoring dynamique |

### 3.2 Ce que Compta Pilot ne fait pas (honnêteté commerciale)

- Pas de saisie comptable complète ni télédéclaration officielle.
- Pas de remplacement d’un ERP comptable certifié.
- Pas d’intégration bancaire automatique (MVP).
- Pas d’application mobile native iOS/Android (responsive web uniquement).
- OCR local (Tesseract) — précision variable sur scans de mauvaise qualité.

### 3.3 Différenciation par rapport au marché

Les briques existent chez Pennylane, Karbon, Dext, etc., mais **peu d’outils simples** combinent en un seul produit léger :

- Obligations **métier français** à la création client
- **Score de fiabilité** influençant l’assignation
- **Workflow validation** pensé cabinet
- **OCR factures** par dossier client
- **Déploiement rapide** (Docker, SQLite, VPS ~5 €/mois)

---

## 4. Architecture technique

### 4.1 Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Server Actions Next.js, API Routes |
| Base de données | SQLite (Prisma ORM) |
| Auth | Cookies signés HMAC, bcrypt (12 rounds) |
| Emails | Nodemailer (SMTP / MAILER_DSN) |
| OCR | Tesseract.js, pdf-parse, canvas (PDF scannés) |
| Conteneurisation | Docker, Docker Compose |
| HTTPS prod | Caddy + Let's Encrypt |

### 4.2 Modèle de données (résumé)

- **User** — rôles, score fiabilité, charge max
- **Client** — dossiers
- **Task** — obligations et tâches métier
- **Notification** — alertes utilisateur
- **Document** — fichiers + résultats OCR

### 4.3 Rôles utilisateurs

| Rôle | Droits principaux |
|------|-------------------|
| **DIRECTOR** (dirigeant) | Vue globale, validation, équipe, suggestions |
| **MANAGER** | Clients, tâches, assignation, validation |
| **COLLABORATOR** | Ses tâches, mise à jour statut, demande validation |

### 4.4 Sécurité (implémentée)

- Sessions signées (`SESSION_SECRET` obligatoire en production)
- Cookies `secure` en HTTPS
- Mots de passe hashés (bcrypt)
- Configuration production validée au démarrage (SMTP, APP_URL)
- Parcours `/setup` pour le premier administrateur (pas de compte démo par défaut)
- Seed démo uniquement si `SEED_DEMO=true`

### 4.5 Déploiement

| Mode | Usage |
|------|-------|
| `npm run dev` | Développement local |
| `npm run docker:up` | Docker local + Mailpit (tests email) |
| `npm run prod:up` | Production VPS + HTTPS (voir DEPLOY.md) |

---

## 5. Travail réalisé — Détail par phase

### Phase 1 — Fondations MVP

- [x] Structure projet Next.js + Prisma + SQLite
- [x] Authentification (login, middleware, sessions)
- [x] CRUD **Clients** (liste, création, fiche détail)
- [x] CRUD **Tâches** (liste, création, fiche, statuts, priorités)
- [x] **Dashboard** dirigeant / manager (KPIs, retards, charge)
- [x] **Assignation intelligente** (`suggestAssigneeId` : charge + fiabilité)
- [x] Interface responsive + navigation (sidebar, shell mobile)
- [x] PWA (`manifest.json`)

### Phase 2 — Automatisation et notifications

- [x] **Modèles d’obligations** à la création client (TVA, URSSAF, bilan, liasse)
- [x] Action **« Générer TVA du mois »** sur le portefeuille
- [x] **Notifications** in-app (page dédiée)
- [x] **Emails SMTP** (assignation, retard, validation, OCR terminé)
- [x] Workflow **demande de validation** / **approbation** sur les tâches

### Phase 3 — Scoring et suggestions

- [x] **Score de fiabilité** dynamique (+2 tâche à temps, −5 en retard)
- [x] Suggestions rule-based sur le dashboard (réassignation, surcharge)

### Phase 4 — Gestion documentaire

- [x] Modèle **Document** + stockage fichiers
- [x] Upload sur fiche client + page globale `/documents`
- [x] **OCR** : images, PDF texte, PDF scannés (rendu pages)
- [x] Extraction : montant, date, fournisseur, n° facture, SIRET
- [x] API téléchargement `/api/documents/[id]`
- [x] Badge statut OCR sur l’interface

### Phase 5 — Passage « réel » (hors démo)

- [x] Sessions signées HMAC
- [x] Parcours **`/setup`** — premier compte dirigeant
- [x] Page **Équipe** — création collaborateurs (dirigeant/manager)
- [x] Emails obligatoires en production
- [x] Seed conditionnel (`SEED_DEMO=true` uniquement)

### Phase 6 — Industrialisation Docker / Prod

- [x] `Dockerfile` multi-stage (deps natives OCR/canvas)
- [x] `docker-compose.yml` — app + Mailpit, volume persistant
- [x] `docker-compose.prod.yml` — Caddy HTTPS
- [x] `DEPLOY.md` — guide VPS, Brevo, checklist patron
- [x] Endpoint santé `/api/health`
- [x] Documentation README, DOCKER.md

---

## 6. Pages et parcours utilisateur

| URL | Description |
|-----|-------------|
| `/setup` | Configuration initiale du cabinet (1er admin) |
| `/login` | Connexion |
| `/` | Dashboard (KPIs, alertes, suggestions) |
| `/clients` | Liste clients |
| `/clients/new` | Nouveau client (+ obligations auto) |
| `/clients/[id]` | Fiche client, tâches, documents |
| `/tasks` | Liste des tâches |
| `/tasks/new` | Nouvelle tâche |
| `/tasks/[id]` | Détail, actions statut / validation |
| `/documents` | Vue globale documents |
| `/notifications` | Centre de notifications |
| `/equipe` | Gestion des comptes (dirigeant) |

---

## 7. Ce qui reste à faire

### 7.1 Priorité haute (avant pilote élargi)

| Item | Description | Effort estimé |
|------|-------------|---------------|
| Export CSV/PDF | Liste tâches en retard, rapport hebdo | 1–2 j |
| Invitation email | Lien mot de passe à la création compte | 1 j |
| Tests automatisés | Auth, assignation, OCR basique | 2–3 j |
| Sauvegarde planifiée | Script backup volume SQLite | 0,5 j |

### 7.2 Priorité moyenne (pilote 1–3 mois)

| Item | Description |
|------|-------------|
| PostgreSQL | Migration SQLite → Postgres multi-utilisateurs |
| Multi-cabinets | Isolation données par cabinet (SaaS) |
| OCR cloud | Google Vision / Azure pour meilleure précision |
| Tableau de bord PDF | Rapport hebdo exportable en un clic |
| Historique / audit | Qui a validé quoi, quand |

### 7.3 Priorité basse (vision long terme)

| Item | Description |
|------|-------------|
| App mobile native | React Native |
| Intégration Pennylane / API compta | Synchronisation dossiers |
| IA avancée | Prédiction retards, chatbot métier |
| Signature électronique | Validation documents |
| Multi-langue | FR/EN |

---

## 8. Plan de mise en production

Voir **[DEPLOY.md](../DEPLOY.md)** pour le détail technique.

### Étapes recommandées

1. **Démo locale** — Docker + données réalistes (`SEED_DEMO` ou clients manuels)
2. **Pilote HTTPS** — VPS + sous-domaine cabinet + Brevo SMTP (~5 €/mois)
3. **Pilote métier** — 2–4 semaines, 10 dossiers réels, 3 utilisateurs
4. **Bilan** — Temps gagné, retards évités, retours équipe
5. **Décision** — Pérenniser, intégrer ERP, ou arrêter

---

## 9. Risques et limites

| Risque | Mitigation |
|--------|------------|
| Attente « remplacement compta » | Communication claire : outil de pilotage |
| OCR imprécis | Vérification humaine ; OCR cloud en phase 2 |
| SQLite seul serveur | Suffisant pilote ; Postgres si montée en charge |
| Un seul cabinet | Architecture prête à évoluer multi-tenant |
| Maintenance stage | Documentation + Docker pour reprise |

---

## 10. Conclusion

Compta Pilot constitue un **MVP fonctionnel et déployable** qui répond à un besoin réel des cabinets : **visibilité, délégation, anti-oubli et validation**. Le travail réalisé couvre l’essentiel du cahier des charges initial (hors app native et intégrations ERP).

**Prochaine étape recommandée :** pilote en production HTTPS sur le domaine du cabinet, avec bilan chiffré à 4 semaines.

---

*Document rédigé dans le cadre du projet Compta Pilot — plateforme-compta*
