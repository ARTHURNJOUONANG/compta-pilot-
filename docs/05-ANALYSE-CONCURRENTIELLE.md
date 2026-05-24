# Compta Pilot — Analyse concurrentielle

*Document de support — présentation direction / stage*

---

## 1. Carte du marché

```
                    SPÉCIALISATION COMPTA / CABINET
                              ▲
                              │
         Karbon ●             │        ● Compta Pilot (cible)
    Financial Cents ●         │          (pilotage + OCR + FR)
                              │
    ──────────────────────────┼──────────────────────────►
    GÉNÉRALISTE               │              COMPLET / ERP
    (Asana, Monday)           │
                              │     ● Pennylane
                              │     ● Cegid / Sage
         Dext ● (OCR)         │     ● Tiime
                              │
                              ▼
                         MOINS MÉTIER CABINET
```

---

## 2. Comparatif synthétique

| Critère | Compta Pilot | Pennylane / Tiime | Cegid / Sage | Karbon | Dext | Asana |
|---------|:------------:|:-----------------:|:------------:|:------:|:----:|:-----:|
| Dashboard retards cabinet | ✅ | Partiel | Partiel | ✅ | ❌ | Partiel |
| Obligations FR auto (TVA, URSSAF…) | ✅ | Partiel | ✅ | ❌ | ❌ | ❌ |
| Assignation charge + fiabilité | ✅ | ❌ | ❌ | Partiel | ❌ | ❌ |
| Workflow validation dirigeant | ✅ | Partiel | Partiel | ✅ | ❌ | Partiel |
| OCR factures par dossier | ✅ | Via outils | Via modules | ❌ | ✅✅ | ❌ |
| Compta réglementée complète | ❌ | ✅✅ | ✅✅ | ❌ | ❌ | ❌ |
| Prix / simplicité déploiement | ✅✅ | Moyen | Élevé | Élevé | Moyen | Faible métier |
| Mobile validation | ✅ (web) | ✅ | Variable | ✅ | ❌ | ✅ |

**Légende :** ✅✅ = point fort | ✅ = présent | Partiel = partiel ou module | ❌ = absent ou hors scope

---

## 3. Concurrents détaillés

### 3.1 Pennylane / Tiime (France)

**Positionnement :** Comptabilité cloud + collaboration client.  
**Forces :** Écosystème complet, adoption forte PME.  
**Faiblesses vs Compta Pilot :** Moins centré sur score collaborateur, assignation intelligente et workflow validation « pur pilotage » en interface légère.  
**Stratégie :** Se positionner en **complément**, pas en remplacement.

### 3.2 Cegid / Sage (France)

**Positionnement :** ERP établis, cabinets structurés.  
**Forces :** Conformité, profondeur métier.  
**Faiblesses :** Coût, déploiement long, interface lourde pour un besoin simple de « qui est en retard ».  
**Stratégie :** Pilote à 5 €/mois vs engagement ERP.

### 3.3 Karbon / Financial Cents (international)

**Positionnement :** Practice management pour cabinets.  
**Forces :** Workflow, email, collaboration.  
**Faiblesses :** Peu d’obligations fiscales françaises natives, tarifs USD, anglais.  
**Stratégie :** Même idée, mais **localisé France** et **open déploiement**.

### 3.4 Dext (ex-Receipt Bank)

**Positionnement :** OCR et capture factures.  
**Forces :** OCR très performant.  
**Faiblesses :** Pas de pilotage équipe, pas d’assignation, pas de dashboard cabinet unifié.  
**Stratégie :** Intégration possible en phase 2 (API Dext).

### 3.5 Asana / Monday / Notion

**Positionnement :** Gestion de projet générique.  
**Forces :** Flexibilité.  
**Faiblesses :** Pas métier compta, configuration lourde, pas OCR ni obligations FR.  
**Stratégie :** Le cabinet a déjà souvent Excel — Compta Pilot est **prêt à l’emploi métier**.

---

## 4. Avantages compétitifs de Compta Pilot (MVP)

1. **Spécialisation cabinet français** — TVA, URSSAF, bilan, liasse dès la création client  
2. **Intelligence organisationnelle** — charge + score fiabilité  
3. **Tout-en-un léger** — pilotage + documents + OCR + emails  
4. **Déploiement rapide** — Docker, SQLite, VPS bon marché  
5. **Propriété / personnalisation** — code source maîtrisé par le cabinet ou le stagiaire  

---

## 5. Risques concurrentiels

| Risque | Réponse |
|--------|---------|
| Pennylane ajoute du pilotage | Se différencier par simplicité et prix pilote |
| Le cabinet n’adopte pas | Pilote 4 semaines, mesure ROI |
| OCR insuffisant | Intégrer Dext / Google Vision en phase 2 |
| « Encore un outil » | Complément, pas remplacement ERP |

---

## 6. Message pour le dirigeant

> « Les grands logiciels font la compta. **Compta Pilot fait la visibilité** : qui est en retard, qui fait quoi, et est-ce que c’est validé. En pilote, on le teste à côté de votre outil actuel, sans migration. »

---

*Analyse concurrentielle — Compta Pilot MVP*
