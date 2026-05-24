# Rapport de projet — Stage

## Compta Pilot : plateforme de pilotage pour cabinet comptable

---

**Étudiant / stagiaire :** *[Nom Prénom]*  
**Établissement :** *[École / université]*  
**Cabinet d’accueil :** *[Nom du cabinet]*  
**Maître de stage :** *[Nom]*  
**Période :** *[Dates]*  
**Version livrable :** MVP — Mai 2026

---

## Remerciements

Je remercie *[Maître de stage]* et l’équipe de *[Cabinet]* pour leur accueil et les échanges qui ont permis d’identifier les besoins réels du pilotage quotidien d’un cabinet comptable.

---

## 1. Introduction

### 1.1 Contexte

Les cabinets comptables de taille moyenne (3 à 15 collaborateurs) font face à une charge administrative croissante : multiplication des obligations fiscales et sociales, attentes clients de réactivité, et difficulté à maintenir une vision globale pour le dirigeant.

Les logiciels comptables (Pennylane, Cegid, Sage…) couvrent la production comptable, mais la **coordination interne** — qui fait quoi, quoi est en retard, qui valide — repose souvent sur Excel, emails et appels.

### 1.2 Objectif du stage

Concevoir et développer un **MVP** d’application web permettant :

- Une vision 360° de l’activité du cabinet
- La délégation intelligente des tâches
- La réduction des oublis d’échéances
- La centralisation documentaire avec aide OCR
- Un workflow de validation adapté au métier

### 1.3 Périmètre

Le projet **ne vise pas** le remplacement d’un logiciel comptable réglementé, mais un **complément organisationnel** déployable rapidement.

---

## 2. Analyse des besoins

### 2.1 Interviews / observations (à personnaliser)

| Besoin exprimé | Priorité | Réponse Compta Pilot |
|----------------|----------|----------------------|
| Voir les retards en un coup d’œil | Haute | Dashboard |
| Ne plus oublier la TVA | Haute | Obligations auto + génération mensuelle |
| Savoir qui est surchargé | Haute | Charge par collaborateur + assignation |
| Valider sans être au bureau | Moyenne | Interface mobile + notifications |
| Centraliser les factures clients | Moyenne | Upload + OCR |
| Traçabilité des validations | Moyenne | Workflow IN_VALIDATION → DONE |

### 2.2 Personas

**Dirigeant (Directeur)**  
- Peu de temps, besoin de synthèse et validation rapide  
- Utilise le téléphone entre rendez-vous  

**Manager**  
- Coordonne l’équipe, crée clients et tâches, assigne  

**Collaborateur comptable**  
- Exécute les tâches, met à jour les statuts, dépose des documents  

---

## 3. État de l’art / concurrentiel

| Solution | Forces | Limites vs notre besoin |
|----------|--------|-------------------------|
| Pennylane, Tiime | Compta + collaboration | Lourd, pilotage charge/fiabilité secondaire |
| Cegid, Sage | Complet, établi | Coût, complexité, pas orienté « anti-oubli » simple |
| Karbon, Financial Cents | Workflow cabinet | Peu adapté obligations FR, souvent anglophone |
| Asana, Monday | Gestion projet | Pas métier compta, pas OCR dossier |
| Dext | OCR factures | Pas dashboard cabinet ni assignation |

**Positionnement Compta Pilot :** assemblage léger et spécialisé **cabinet français PME**, déployable en Docker sur un VPS à faible coût.

---

## 4. Conception

### 4.1 Architecture

Application **monolithique moderne** : Next.js full-stack, Server Actions, SQLite via Prisma. Choix motivé par la rapidité de développement en stage et la simplicité de déploiement (un conteneur Docker, volume persistant).

### 4.2 Modèle de données

Entités principales : User, Client, Task, Notification, Document.  
Rôles : DIRECTOR, MANAGER, COLLABORATOR.  
Statuts tâche : TODO, IN_PROGRESS, IN_VALIDATION, DONE.

### 4.3 Algorithmes métier

**Assignation** — Tri des collaborateurs par ratio charge/plafond, puis par score de fiabilité décroissant.

**Scoring** — +2 points si tâche terminée à temps, −5 si en retard ; score initial 75/100.

**Obligations** — Templates TVA (fin de mois), URSSAF (+15 j), bilan (31/03), liasse (30/04).

---

## 5. Réalisations techniques

### 5.1 Fonctionnalités livrées

*(Liste complète — voir document 01-PRESENTATION-PROJET.md, section 5)*

Résumé : 6 phases couvrant MVP, automatisation, scoring, documents/OCR, comptes réels, Docker/production.

### 5.2 Stack technique

Next.js 16, React 19, Prisma, SQLite, Tailwind, Tesseract.js, Nodemailer, Docker, Caddy.

### 5.3 Sécurité

Sessions HMAC, bcrypt, validation config production, HTTPS, pas de comptes démo par défaut.

### 5.4 Déploiement

- Local : `npm run dev`
- Docker : `npm run docker:up` (+ Mailpit)
- Production : `docker-compose.prod.yml` + DEPLOY.md

---

## 6. Tests et validation

### 6.1 Tests manuels effectués

| Scénario | Résultat |
|----------|----------|
| Setup premier admin | OK |
| Création client + obligations | OK |
| Assignation suggérée | OK |
| Workflow validation | OK |
| Upload + OCR facture JPG | OK |
| Email notification (Mailpit/Brevo) | OK |
| Docker volume persistant | OK |

### 6.2 Tests automatisés

Non implémentés dans le MVP — recommandés en phase 2.

---

## 7. Difficultés rencontrées

| Difficulté | Solution |
|------------|----------|
| Build Docker Windows (EOF) | Redémarrage Docker Desktop, COMPOSE_BAKE=false |
| Dépendances natives (canvas, Tesseract) | Dockerfile multi-stage avec libs système |
| Hydratation React (extensions navigateur) | suppressHydrationWarning |
| SMTP obligatoire en prod | Mailpit (dev) / Brevo (prod) |
| CRLF entrypoint Windows | sed dans Dockerfile |

---

## 8. Résultats et indicateurs attendus

En pilote 4 semaines (à mesurer avec le cabinet) :

| KPI | Méthode de mesure |
|-----|-------------------|
| Temps hebdo de coordination dirigeant | Questionnaire avant/après |
| Nombre de retards non détectés | Comparaison dashboard vs suivi Excel |
| Tâches validées via mobile | Logs / observation |
| Satisfaction équipe | Entretien 3 collaborateurs |

Objectif annoncé : **−30 à 50 %** de temps sur la coordination (non mesuré à ce jour sur données réelles).

---

## 9. Perspectives et travail restant

### Court terme
- Export CSV/PDF rapports
- Invitation email nouveaux comptes
- Pilote HTTPS sur domaine cabinet

### Moyen terme
- PostgreSQL, multi-cabinets
- OCR cloud
- Intégration API comptable

### Long terme
- Application mobile native
- IA prédictive retards

---

## 10. Conclusion

Le projet **Compta Pilot** démontre la faisabilité d’un outil de pilotage cabinet **complet en MVP**, déployable et présentable au dirigeant. Le travail réalisé couvre l’essentiel du cahier des charges fonctionnel initial.

La valeur pour le cabinet réside dans la **visibilité**, l’**anti-oubli** et la **délégation intelligente**, pas dans la reproduction d’un ERP comptable.

**Recommandation :** lancer un pilote encadré de 4 semaines sur un échantillon de dossiers réels avant toute décision d’investissement plus lourd.

---

## Annexes

- A. [Présentation détaillée](./01-PRESENTATION-PROJET.md)
- B. [Fiche commerciale](./02-FICHE-COMMERCIALE.md)
- C. [Scénario démo](./03-SCENARIO-DEMO.md)
- D. [Analyse concurrentielle](./05-ANALYSE-CONCURRENTIELLE.md)
- E. [Roadmap](./06-ROADMAP.md)
- F. [Guide déploiement](../DEPLOY.md)

---

*Rapport rédigé dans le cadre du stage — Compta Pilot*
