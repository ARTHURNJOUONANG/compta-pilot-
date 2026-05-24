# Dossier de présentation — Compta Pilot

Documents pour convaincre le patron, soutenir le stage et préparer la démo.

## Documents disponibles

| Fichier | Usage | Format |
|---------|-------|--------|
| [01-PRESENTATION-PROJET.md](./01-PRESENTATION-PROJET.md) | Présentation complète : contexte, réalisations, reste à faire | Markdown |
| [02-FICHE-COMMERCIALE.md](./02-FICHE-COMMERCIALE.md) | 1 page à remettre au dirigeant | Markdown |
| [03-SCENARIO-DEMO.md](./03-SCENARIO-DEMO.md) | Script démo 15 min minute par minute | Markdown |
| [04-RAPPORT-STAGE.md](./04-RAPPORT-STAGE.md) | Rapport de stage structuré | Markdown |
| [05-ANALYSE-CONCURRENTIELLE.md](./05-ANALYSE-CONCURRENTIELLE.md) | Comparatif marché | Markdown |
| [06-ROADMAP.md](./06-ROADMAP.md) | Phases futures | Markdown |
| [07-USER-STORIES.md](./07-USER-STORIES.md) | User stories par epic et persona | Markdown |
| [DOSSIER-COMPLET.html](./DOSSIER-COMPLET.html) | **Tout-en-un pour PDF** (sections 1–12 + user stories) | HTML → PDF |
| [DOSSIER-COMPLET-UPDATED.html](./DOSSIER-COMPLET-UPDATED.html) | Même contenu si `DOSSIER-COMPLET.html` pas encore remplacé | HTML → PDF |

## Générer un PDF

1. Ouvrir **`DOSSIER-COMPLET.html`** (ou `DOSSIER-COMPLET-UPDATED.html`) dans Chrome ou Edge
2. `Ctrl + P` → **Enregistrer au format PDF**
3. Marges : par défaut | Cocher « Graphiques d’arrière-plan »

## À personnaliser avant remise

Dans chaque document, remplacer les champs `*[...]*` :

- Votre nom, école, cabinet, maître de stage, dates
- URL de production si déployée
- Coordonnées de contact

## Export données (application)

| Besoin | État MVP | Alternative immédiate |
|--------|----------|----------------------|
| Export CSV tâches | À développer (Phase 1) | Copier depuis `/tasks` ou Prisma Studio |
| Rapport PDF hebdo | À développer | Imprimer page dashboard (Ctrl+P) |
| Backup base | Manuel | Voir [DEPLOY.md](../DEPLOY.md) section sauvegarde |
