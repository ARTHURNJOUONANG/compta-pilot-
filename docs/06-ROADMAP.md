# Compta Pilot — Roadmap

*Plan d’évolution post-MVP — Mai 2026*

---

## Vue d’ensemble

```
Phase 0 (FAIT)     Phase 1           Phase 2            Phase 3
   MVP          Pilote prod      Consolidation        Scale
    │                │                 │                  │
    ▼                ▼                 ▼                  ▼
 Docker          HTTPS +           Postgres           Multi-cabinet
 Auth            10 dossiers       Export PDF         App native
 OCR             Brevo SMTP        Tests auto         API ERP
 Workflow        Bilan KPI         OCR cloud          IA prédictive
```

---

## Phase 0 — MVP (terminé)

| Livrable | Statut |
|----------|--------|
| Auth + rôles + setup | ✅ |
| Clients, tâches, dashboard | ✅ |
| Assignation + scoring | ✅ |
| Obligations auto + TVA mensuelle | ✅ |
| Notifications + emails | ✅ |
| Documents + OCR | ✅ |
| Docker + guide prod | ✅ |

---

## Phase 1 — Pilote production (2–4 semaines)

**Objectif :** Convaincre le dirigeant avec des données réelles.

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Déploiement HTTPS (VPS + domaine) | P0 | 1 j |
| Configuration Brevo SMTP | P0 | 2 h |
| Création comptes réels (dirigeant + 2 collab.) | P0 | 1 h |
| Import manuel 10 clients pilote | P0 | 2 h |
| Export CSV tâches en retard | P1 | 4 h |
| Rapport hebdo (page ou PDF) | P1 | 1 j |
| Vidéo démo 3 min | P1 | 2 h |
| Mesure KPI avant/après pilote | P0 | Continu |

**Critères de succès pilote :**
- Dirigeant consulte le dashboard ≥ 3×/semaine
- ≥ 1 validation depuis mobile
- ≥ 5 emails de notification utiles reçus
- Retour équipe : « on voit mieux les retards »

---

## Phase 2 — Consolidation (1–3 mois)

| Tâche | Priorité |
|-------|----------|
| Invitation email + reset mot de passe | Haute |
| Tests automatisés (auth, tâches) | Haute |
| Sauvegarde automatique SQLite | Haute |
| Migration PostgreSQL | Moyenne |
| OCR cloud (précision) | Moyenne |
| Historique audit validations | Moyenne |
| Tableau de bord export PDF | Moyenne |
| Bandeau « mode démo » + reset | Basse |

---

## Phase 3 — Scale (6–12 mois)

| Tâche | Priorité |
|-------|----------|
| Multi-cabinets (SaaS) | Haute si commercialisation |
| Intégration Pennylane / API | Moyenne |
| Application React Native | Moyenne |
| IA : prédiction retards | Basse |
| Signature électronique | Basse |
| Facturation SaaS | Si produit externe |

---

## Backlog fonctionnel (non planifié)

- [ ] Export Excel complet portefeuille
- [ ] Calendrier échéances visuel
- [ ] Rappels SMS
- [ ] Portail client (upload factures par le client)
- [ ] Multi-langue
- [ ] SSO / Active Directory

---

## Estimation charge (indicative)

| Phase | Charge dev solo |
|-------|-----------------|
| Phase 1 | 3–5 jours |
| Phase 2 | 3–4 semaines |
| Phase 3 | 2–4 mois |

---

*Roadmap vivante — à ajuster avec le maître de stage*
