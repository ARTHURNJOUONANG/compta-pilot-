# Compta Pilot — User Stories

*Format : En tant que [persona], je veux [action], afin de [bénéfice].*

**Personas :**
- **DIR** — Dirigeant du cabinet (`DIRECTOR`)
- **MGR** — Manager / chef d’équipe (`MANAGER`)
- **COL** — Collaborateur comptable (`COLLABORATOR`)
- **SYS** — Système / administrateur technique (première installation)

**Légende statut MVP :** ✅ Livré | 🔶 Partiel | ⬜ Non livré

---

## Epic 1 — Installation et accès

### US-1.1 — Première configuration du cabinet
**En tant que** DIR (première visite),  
**je veux** créer le compte dirigeant via un parcours dédié (`/setup`),  
**afin de** démarrer l’application sans données fictives ni compte préconfiguré.

**Critères d’acceptation :**
- [x] ✅ Page `/setup` accessible uniquement si aucun utilisateur n’existe
- [x] ✅ Saisie : nom, email, mot de passe
- [x] ✅ Création du compte avec rôle `DIRECTOR`
- [x] ✅ Redirection vers le dashboard après configuration
- [x] ✅ `/setup` inaccessible une fois un utilisateur créé

---

### US-1.2 — Connexion sécurisée
**En tant que** utilisateur (DIR, MGR, COL),  
**je veux** me connecter avec mon email et mon mot de passe,  
**afin d’** accéder à mon espace de travail en toute sécurité.

**Critères d’acceptation :**
- [x] ✅ Page `/login` avec formulaire email / mot de passe
- [x] ✅ Mot de passe hashé (bcrypt)
- [x] ✅ Session signée (cookie HMAC)
- [x] ✅ Cookie `secure` en production (HTTPS)
- [x] ✅ Redirection vers `/login` si non authentifié
- [x] ✅ Déconnexion possible

---

### US-1.3 — Déconnexion
**En tant que** utilisateur connecté,  
**je veux** me déconnecter,  
**afin de** protéger mes données sur un poste partagé.

**Critères d’acceptation :**
- [x] ✅ Action de déconnexion disponible
- [x] ✅ Suppression de la session et redirection vers `/login`

---

## Epic 2 — Gestion de l’équipe

### US-2.1 — Créer un compte collaborateur
**En tant que** DIR ou MGR,  
**je veux** créer un compte pour un nouveau collaborateur (nom, email, rôle, mot de passe),  
**afin qu’** il puisse se connecter et recevoir des tâches.

**Critères d’acceptation :**
- [x] ✅ Page **Équipe** (`/equipe`) accessible aux DIR et MGR
- [x] ✅ Rôles assignables : Collaborateur, Manager (Dirigeant réservé au DIR)
- [x] ✅ Plafond de tâches simultanées défini selon le rôle
- [ ] ⬜ Envoi d’un email d’invitation avec lien de première connexion

---

### US-2.2 — Consulter la charge et la fiabilité de l’équipe
**En tant que** DIR ou MGR,  
**je veux** voir pour chaque collaborateur son nombre de tâches en cours et son score de fiabilité,  
**afin de** décider à qui déléguer un dossier sensible.

**Critères d’acceptation :**
- [x] ✅ Liste des membres sur la page Équipe et le dashboard
- [x] ✅ Affichage du score de fiabilité (0–100)
- [x] ✅ Affichage du nombre de tâches non terminées vs plafond

---

## Epic 3 — Gestion des clients (dossiers)

### US-3.1 — Créer un client
**En tant que** DIR ou MGR,  
**je veux** enregistrer un nouveau client (raison sociale, SIRET, contacts, notes),  
**afin de** centraliser son dossier dans l’application.

**Critères d’acceptation :**
- [x] ✅ Formulaire de création (`/clients/new`)
- [x] ✅ Champs : nom (obligatoire), SIRET, email, téléphone, notes
- [x] ✅ Redirection vers la fiche client après création

---

### US-3.2 — Générer les obligations à la création du client
**En tant que** DIR ou MGR,  
**je veux** que les obligations récurrentes soient créées automatiquement à l’ajout d’un client,  
**afin de** ne pas oublier TVA, URSSAF, bilan ou liasse.

**Critères d’acceptation :**
- [x] ✅ Création automatique des tâches : TVA mensuelle, URSSAF, bilan annuel, liasse fiscale
- [x] ✅ Échéances calculées selon règles métier (fin de mois, dates fiscales)
- [x] ✅ Assignation suggérée sur chaque tâche créée
- [x] ✅ Notification + email à l’assigné

---

### US-3.3 — Consulter la liste des clients
**En tant que** DIR, MGR ou COL,  
**je veux** voir la liste de tous les clients du cabinet,  
**afin de** accéder rapidement à un dossier.

**Critères d’acceptation :**
- [x] ✅ Page `/clients` avec liste des clients
- [x] ✅ Lien vers la fiche détail de chaque client

---

### US-3.4 — Consulter la fiche client
**En tant que** DIR, MGR ou COL,  
**je veux** ouvrir la fiche d’un client avec ses informations, tâches et documents,  
**afin d’** avoir une vue 360° du dossier.

**Critères d’acceptation :**
- [x] ✅ Page `/clients/[id]` avec coordonnées
- [x] ✅ Liste des tâches liées au client
- [x] ✅ Section documents du client

---

### US-3.5 — Modifier ou supprimer un client
**En tant que** DIR ou MGR,  
**je veux** modifier ou supprimer un client,  
**afin de** maintenir le portefeuille à jour.

**Critères d’acceptation :**
- [x] ✅ Modification des informations client (DIR / MGR)
- [x] ✅ Suppression client (DIR / MGR)
- [x] 🔶 COL : consultation seule (pas de modification client)

---

## Epic 4 — Gestion des tâches

### US-4.1 — Créer une tâche manuelle
**En tant que** DIR ou MGR,  
**je veux** créer une tâche (titre, catégorie, priorité, échéance, client, assigné),  
**afin de** suivre une mission ponctuelle hors modèle d’obligation.

**Critères d’acceptation :**
- [x] ✅ Page `/tasks/new`
- [x] ✅ Champs : titre, description, catégorie, priorité, date d’échéance, client, assigné
- [x] ✅ Suggestion d’assignation par défaut
- [x] ✅ Notification à l’assigné si différent du créateur

---

### US-4.2 — Consulter toutes les tâches
**En tant que** DIR, MGR ou COL,  
**je veux** voir la liste des tâches avec statut, priorité et échéance,  
**afin de** organiser mon travail.

**Critères d’acceptation :**
- [x] ✅ Page `/tasks` avec liste filtrable / triable
- [x] ✅ Badges statut et priorité visibles
- [x] ✅ Indication des tâches en retard

---

### US-4.3 — Consulter le détail d’une tâche
**En tant que** DIR, MGR ou COL,  
**je veux** ouvrir une tâche et voir toutes ses informations,  
**afin de** comprendre le contexte avant d’agir.

**Critères d’acceptation :**
- [x] ✅ Page `/tasks/[id]` avec client, assigné, dates, description
- [x] ✅ Actions de changement de statut selon le rôle

---

### US-4.4 — Assignation intelligente
**En tant que** DIR ou MGR,  
**je veux** que le système me propose le collaborateur le plus adapté,  
**afin de** équilibrer la charge et privilégier les profils fiables.

**Critères d’acceptation :**
- [x] ✅ Algorithme basé sur : tâches en cours / plafond, puis score de fiabilité
- [x] ✅ Proposition à la création client, tâche et obligations
- [x] ✅ Réassignation manuelle possible

---

### US-4.5 — Prendre en charge une tâche (collaborateur)
**En tant que** COL,  
**je veux** passer une tâche au statut « En cours »,  
**afin d’** indiquer que je travaille dessus.

**Critères d’acceptation :**
- [x] ✅ Transition `TODO` → `IN_PROGRESS`
- [x] ✅ Uniquement sur les tâches qui me sont assignées (ou selon règles MGR/DIR)

---

### US-4.6 — Demander une validation
**En tant que** COL,  
**je veux** soumettre une tâche terminée à validation,  
**afin que** un manager ou le dirigeant contrôle mon travail avant clôture.

**Critères d’acceptation :**
- [x] ✅ Transition vers `IN_VALIDATION`
- [x] ✅ Notification aux DIR et MGR
- [x] ✅ Email envoyé aux responsables

---

### US-4.7 — Valider ou refuser une tâche
**En tant que** DIR ou MGR,  
**je veux** approuver une tâche en validation ou la renvoyer en cours,  
**afin de** garantir la qualité avant clôture définitive.

**Critères d’acceptation :**
- [x] ✅ Action « Approuver » → statut `DONE`
- [x] ✅ Mise à jour du score de fiabilité de l’assigné (+2 si à temps, −5 si retard)
- [x] ✅ Notification à l’assigné

---

### US-4.8 — Générer la TVA du mois pour tout le portefeuille
**En tant que** DIR ou MGR,  
**je veux** lancer en un clic la création des tâches TVA du mois pour tous les clients,  
**afin de** ne pas oublier une échéance mensuelle.

**Critères d’acceptation :**
- [x] ✅ Bouton « Générer TVA du mois » sur le dashboard
- [x] ✅ Création des tâches uniquement si pas déjà existantes pour la période
- [x] ✅ Message de confirmation (nombre de tâches créées)

---

## Epic 5 — Tableau de bord et pilotage

### US-5.1 — Vue synthétique du cabinet
**En tant que** DIR ou MGR,  
**je veux** un tableau de bord avec les indicateurs clés,  
**afin de** savoir en 5 secondes si le cabinet va bien.

**Critères d’acceptation :**
- [x] ✅ Nombre de clients
- [x] ✅ Répartition des tâches par statut
- [x] ✅ Nombre de tâches en retard
- [x] ✅ Nombre de tâches urgentes ouvertes
- [x] ✅ Liste des tâches récentes / prioritaires

---

### US-5.2 — Suivre la charge de l’équipe
**En tant que** DIR ou MGR,  
**je veux** voir la charge de chaque collaborateur sur le dashboard,  
**afin d’** identifier les surcharges et les disponibilités.

**Critères d’acceptation :**
- [x] ✅ Bloc « Équipe » avec tâches en cours / plafond par personne
- [x] ✅ Score de fiabilité affiché

---

### US-5.3 — Recevoir des suggestions d’action
**En tant que** DIR ou MGR,  
**je veux** que l’application me suggère des actions (réassignation, surcharge),  
**afin de** réagir proactivement aux risques.

**Critères d’acceptation :**
- [x] ✅ Suggestions rule-based (collaborateur surchargé, tâche urgente non assignée, etc.)
- [x] ✅ Affichage sur le dashboard

---

### US-5.4 — Consulter mon tableau de bord (collaborateur)
**En tant que** COL,  
**je veux** voir mes tâches prioritaires et les alertes qui me concernent,  
**afin de** me concentrer sur l’essentiel.

**Critères d’acceptation :**
- [x] ✅ Accès au dashboard (vue adaptée au rôle)
- [x] ✅ Tâches récentes et alertes visibles

---

## Epic 6 — Notifications et emails

### US-6.1 — Recevoir des notifications in-app
**En tant que** utilisateur,  
**je veux** être notifié dans l’application des événements importants,  
**afin de** ne rien manquer sans consulter mes emails.

**Critères d’acceptation :**
- [x] ✅ Types : assignation, retard, demande validation, tâche terminée, OCR terminé
- [x] ✅ Page `/notifications` avec liste et marquage lu
- [x] ✅ Lien vers la tâche ou le client concerné

---

### US-6.2 — Recevoir un email pour les événements critiques
**En tant que** utilisateur,  
**je veux** recevoir un email avec un lien direct vers la tâche,  
**afin d’** être alerté même hors de l’application.

**Critères d’acceptation :**
- [x] ✅ Envoi SMTP (Brevo, etc.) en production
- [x] ✅ Email sur : assignation, retard, validation demandée, validation approuvée
- [x] ✅ Lien `APP_URL` vers la ressource concernée

---

### US-6.3 — Être alerté des tâches en retard
**En tant que** DIR ou MGR,  
**je veux** que le système détecte les tâches dépassant l’échéance,  
**afin de** relancer avant que le client soit impacté.

**Critères d’acceptation :**
- [x] ✅ Synchronisation des notifications de retard (`syncOverdueNotifications`)
- [x] ✅ Compteur « en retard » sur le dashboard
- [x] ✅ Notification + email aux responsables

---

## Epic 7 — Gestion documentaire et OCR

### US-7.1 — Déposer un document sur un dossier client
**En tant que** DIR, MGR ou COL,  
**je veux** téléverser un fichier (facture, justificatif) sur la fiche client,  
**afin de** centraliser les pièces du dossier.

**Critères d’acceptation :**
- [x] ✅ Upload depuis la fiche client
- [x] ✅ Catégories : Facture, Justificatif, Contrat, Autre
- [x] ✅ Libellé optionnel
- [x] ✅ Stockage persistant (volume Docker ou dossier local)

---

### US-7.2 — Consulter tous les documents du cabinet
**En tant que** DIR ou MGR,  
**je veux** une vue globale de tous les documents déposés,  
**afin de** retrouver une pièce sans ouvrir chaque fiche client.

**Critères d’acceptation :**
- [x] ✅ Page `/documents` avec liste
- [x] ✅ Lien vers le client et téléchargement

---

### US-7.3 — Télécharger un document
**En tant que** utilisateur autorisé,  
**je veux** télécharger un document déposé,  
**afin de** l’ouvrir ou le transmettre.

**Critères d’acceptation :**
- [x] ✅ API `/api/documents/[id]` avec contrôle d’accès
- [x] ✅ Téléchargement du fichier original

---

### US-7.4 — Extraire automatiquement les données d’une facture (OCR)
**En tant que** COL,  
**je veux** que le système lise une facture uploadée (PDF ou image),  
**afin de** gagner du temps sur la saisie (montant, date, fournisseur, SIRET).

**Critères d’acceptation :**
- [x] ✅ OCR sur images (JPG, PNG)
- [x] ✅ OCR sur PDF texte et PDF scannés
- [x] ✅ Extraction : montant TTC, date, fournisseur, n° facture, SIRET
- [x] ✅ Statuts OCR : en attente, en cours, terminé, échec
- [x] ✅ Badge visuel du statut OCR
- [x] ✅ Notification « OCR terminé » à l’utilisateur

---

### US-7.5 — Supprimer un document
**En tant que** DIR, MGR (ou COL sur ses propres uploads),  
**je veux** supprimer un document erroné,  
**afin de** maintenir le dossier propre.

**Critères d’acceptation :**
- [x] ✅ Suppression autorisée selon règles de rôle
- [x] ✅ Fichier supprimé du stockage

---

## Epic 8 — Scoring et qualité

### US-8.1 — Score de fiabilité automatique
**En tant que** DIR,  
**je veux** que le score de fiabilité de chaque collaborateur évolue selon ses performances,  
**afin d’** objectiver la délégation des dossiers sensibles.

**Critères d’acceptation :**
- [x] ✅ Score initial : 75/100
- [x] ✅ +2 si tâche validée à temps
- [x] ✅ −5 si tâche validée en retard
- [x] ✅ Score visible sur Équipe et Dashboard

---

## Epic 9 — Mobile et accessibilité

### US-9.1 — Utiliser l’application sur mobile
**En tant que** DIR,  
**je veux** consulter le dashboard et valider des tâches depuis mon téléphone,  
**afin de** piloter le cabinet en déplacement.

**Critères d’acceptation :**
- [x] ✅ Interface responsive (sidebar → menu mobile)
- [x] ✅ PWA (`manifest.json`) installable sur écran d’accueil
- [ ] ⬜ Application native iOS / Android

---

## Epic 10 — Déploiement et exploitation

### US-10.1 — Déployer en production sur le domaine du cabinet
**En tant que** administrateur (SYS / stagiaire),  
**je veux** déployer l’application en HTTPS sur un serveur,  
**afin que** le dirigeant y accède via une URL professionnelle.

**Critères d’acceptation :**
- [x] ✅ Docker Compose production + Caddy (Let's Encrypt)
- [x] ✅ Guide DEPLOY.md (VPS, Brevo, checklist)
- [x] ✅ Volume persistant SQLite + uploads
- [x] ✅ Endpoint `/api/health` pour vérifier le service

---

### US-10.2 — Sauvegarder les données
**En tant que** SYS,  
**je veux** sauvegarder régulièrement la base et les fichiers,  
**afin de** ne pas perdre les données du cabinet.

**Critères d’acceptation :**
- [x] 🔶 Commande manuelle documentée dans DEPLOY.md
- [ ] ⬜ Sauvegarde automatique planifiée

---

### US-10.3 — Mode démo pour présentation
**En tant que** stagiaire,  
**je veux** charger des données de démonstration optionnelles,  
**afin de** présenter l’application sans saisir tout manuellement.

**Critères d’acceptation :**
- [x] ✅ Seed activable via `SEED_DEMO=true`
- [x] ✅ Comptes démo documentés (non activés par défaut en prod)
- [ ] ⬜ Bouton « Réinitialiser démo » dans l’interface

---

## Epic 11 — Rapports et exports (backlog)

### US-11.1 — Exporter les tâches en retard
**En tant que** DIR,  
**je veux** exporter en CSV la liste des tâches en retard,  
**afin de** l’intégrer dans un reporting ou une réunion d’équipe.

**Critères d’acceptation :**
- [ ] ⬜ Bouton export CSV sur `/tasks` ou dashboard
- [ ] ⬜ Colonnes : client, tâche, assigné, échéance, jours de retard

---

### US-11.2 — Rapport hebdomadaire PDF
**En tant que** DIR,  
**je veux** générer un rapport PDF hebdomadaire (retards, validations, charge),  
**afin de** archiver ou partager la synthèse au conseil de cabinet.

**Critères d’acceptation :**
- [ ] ⬜ Page ou action « Rapport hebdo »
- [ ] ⬜ Export PDF téléchargeable

---

## Matrice persona × epic

| Epic | DIR | MGR | COL | SYS |
|------|:---:|:---:|:---:|:---:|
| Installation | ● | | | ● |
| Équipe | ● | ● | | |
| Clients | ● | ● | ○ | |
| Tâches | ● | ● | ● | |
| Dashboard | ● | ● | ○ | |
| Notifications | ● | ● | ● | |
| Documents / OCR | ● | ● | ● | |
| Scoring | ● (lecture) | ○ | ○ | |
| Mobile | ● | ○ | ○ | |
| Déploiement | | | | ● |
| Exports | ● | ○ | | |

● = stories principales | ○ = stories secondaires

---

## Priorisation MoSCoW (MVP livré)

| Must have (livré) | Should have (backlog proche) | Could have | Won't have (MVP) |
|-------------------|------------------------------|------------|------------------|
| Auth, setup, rôles | Export CSV | Rapport PDF | Compta réglementée |
| Clients + obligations auto | Invitation email | OCR cloud | Télédéclaration |
| Tâches + workflow validation | Sauvegarde auto | Multi-cabinets | App native |
| Dashboard + assignation | Tests auto | Portail client | Intégration banque |
| Notifications + emails | | | |
| Documents + OCR | | | |

---

*User stories Compta Pilot — alignées sur le MVP de mai 2026*
