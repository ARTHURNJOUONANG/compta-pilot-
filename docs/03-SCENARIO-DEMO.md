# Compta Pilot — Scénario de démonstration détaillé

**Durée totale : 12 à 15 minutes**  
**Public : dirigeant de cabinet, manager**  
**Prérequis : application démarrée (Docker ou production HTTPS)**

---

## Préparation avant la réunion (30 min)

### Environnement

- [ ] Application accessible : `https://compta.votrecabinet.fr` ou `http://localhost:3001`
- [ ] Compte **dirigeant** créé via `/setup` (ou seed démo)
- [ ] 2 comptes collaborateurs dans **Équipe**
- [ ] Mailpit ou Brevo testé (1 email reçu)
- [ ] Navigateur : 1 fenêtre desktop + 1 fenêtre mobile (ou DevTools F12 → mode téléphone)
- [ ] Vidéo de secours (3 min) si la connexion live échoue

### Données à préparer

| Élément | Exemple |
|---------|---------|
| Client 1 | SARL Martin — SIRET 123 456 789 00012 |
| Client 2 | EURL Dupont — en retard TVA (échéance passée) |
| Client 3 | SAS Innovation — tâche en validation |
| Facture test | PDF ou JPG facture fournisseur (pour OCR) |

### Comptes (si mode démo seed)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| directeur@cabinet.fr | demo123 | Dirigeant |
| manager@cabinet.fr | demo123 | Manager |
| comptable@cabinet.fr | demo123 | Collaborateur |

> En production réelle : utiliser les vrais emails du cabinet, **pas** demo123.

---

## Script minute par minute

### Introduction (1 min)

**À dire :**

> « Compta Pilot est un outil de **pilotage** du cabinet. Il ne remplace pas Pennylane ou Cegid. En 15 minutes, je vous montre comment voir tous les retards, déléguer une tâche au bon collaborateur, valider depuis votre téléphone, et traiter une facture client automatiquement. »

---

### Étape 1 — Connexion dirigeant (1 min)

1. Ouvrir `/login`
2. Se connecter en **dirigeant**
3. Arriver sur le **Dashboard**

**À dire :**

> « Dès la connexion, vous voyez l’état du cabinet : tâches en retard, en validation, charge par collaborateur. Plus besoin d’appeler chaque personne. »

**Montrer :**
- Nombre de tâches en retard
- Tâches urgentes
- Charge équipe (si visible)
- Suggestions (réassignation, surcharge)

---

### Étape 2 — Création d’un nouveau client (2 min)

1. Menu **Clients** → **Nouveau client**
2. Saisir : `SARL Présentation Demo`
3. SIRET, email, téléphone (optionnel)
4. Enregistrer

**À dire :**

> « Quand on ajoute un client, le système crée automatiquement les obligations : TVA mensuelle, URSSAF, bilan, liasse. On ne part plus d’une feuille Excel vide. »

**Montrer :**
- Liste des tâches générées sur la fiche client
- Dates d’échéance
- Priorités (urgent / important / normal)

---

### Étape 3 — Assignation intelligente (2 min)

1. Ouvrir une tâche **non assignée** ou créer une tâche « Contrôle TVA mars »
2. Cliquer sur **assignation suggérée** (ou assigner manuellement en montrant la logique)
3. Choisir le collaborateur proposé

**À dire :**

> « Le système propose le collaborateur le moins chargé, avec le meilleur score de fiabilité. Moins d’erreurs sur les dossiers sensibles. »

**Montrer :**
- Score de fiabilité sur la page Équipe (si temps)

---

### Étape 4 — Côté collaborateur (3 min)

1. **Déconnexion** → connexion `comptable@...` (ou 2e navigateur privé)
2. Menu **Tâches** → ouvrir la tâche assignée
3. Passer statut : **En cours** → **Demander validation**
4. (Optionnel) Marquer comme terminée selon workflow

**À dire :**

> « Le collaborateur ne valide pas seul : il demande une validation. Le dirigeant garde le contrôle qualité. »

---

### Étape 5 — Validation dirigeant sur mobile (2 min)

1. Reconnexion **dirigeant** (ou fenêtre mobile)
2. Réduire la fenêtre / mode téléphone
3. Dashboard ou **Tâches** → filtre « en validation »
4. Ouvrir la tâche → **Approuver / Valider**

**À dire :**

> « Vous pouvez valider depuis votre téléphone entre deux rendez-vous, sans ouvrir l’ordinateur. »

---

### Étape 6 — Document et OCR (2 min)

1. Fiche client → section **Documents**
2. Upload une **facture** (PDF ou image)
3. Attendre traitement OCR (quelques secondes à 1 min)
4. Montrer montant, date, SIRET extraits

**À dire :**

> « Le client dépose sa facture ; le système lit le montant et la date. Le collaborateur gagne du temps de saisie. »

---

### Étape 7 — Notifications et email (1 min)

1. Menu **Notifications** — liste des alertes
2. Ouvrir **Mailpit** (http://localhost:8025) ou boîte mail réelle
3. Montrer l’email « tâche assignée » ou « validation demandée »

**À dire :**

> « Chaque événement important envoie un email avec un lien direct vers la tâche. »

---

### Étape 8 — Action portefeuille TVA (1 min)

1. Retour dashboard ou page clients
2. Bouton **« Générer TVA du mois »** (si disponible)
3. Montrer les nouvelles tâches créées

**À dire :**

> « En un clic, on génère les déclarations TVA du mois pour tout le portefeuille. »

---

### Conclusion et appel à l’action (1 min)

**À dire :**

> « Ce que vous avez vu est un MVP déployable. Je propose un **pilote de 4 semaines** sur 10 dossiers réels, avec vous et deux collaborateurs. Coût serveur : environ 5 euros par mois. À la fin, on mesure le temps gagné et on décide ensemble. »

**Questions à poser au patron :**

1. « Quel est aujourd’hui votre plus gros irritant : retards, charge, ou documents ? »
2. « Seriez-vous d’accord pour tester sur 10 dossiers pendant un mois ? »
3. « Avez-vous un sous-domaine disponible, par exemple compta.votrecabinet.fr ? »

---

## Plan B — Si problème technique

| Problème | Action |
|----------|--------|
| Docker ne démarre pas | Lancer `npm run dev` en local |
| OCR lent | Utiliser une image JPG simple, pas un gros PDF scanné |
| Email ne part pas | Montrer Mailpit ou capture d’écran préparée |
| Connexion impossible | Lancer la vidéo de secours |

---

## Checklist jour J

- [ ] PC chargé, Docker démarré 15 min avant
- [ ] URL testée sur 4G (téléphone)
- [ ] Comptes et données prêts
- [ ] Fiche commerciale imprimée ou PDF
- [ ] Rapport de stage / présentation projet imprimé
- [ ] Ton calme, parler **bénéfices métier**, pas jargon technique

---

*Compta Pilot — Scénario démo v1*
