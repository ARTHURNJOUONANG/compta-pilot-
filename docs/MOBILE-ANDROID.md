# Application mobile Android (Capacitor)

Pipeline de generation d'APK pour **Plateforme Compta**, base sur l'atelier Keyce (Docker local + GitHub Actions).

## Principe

L'application Next.js reste deployee sur Vercel. L'APK Android est une **WebView Capacitor** qui charge l'URL de production (`CAPACITOR_SERVER_URL`).

## Partie A — Build Docker local (Windows)

1. Copier la configuration mobile :

```powershell
cd plateforme-compta
copy .env.mobile.example .env.mobile
```

2. Verifier `CAPACITOR_SERVER_URL` dans `.env.mobile`.

3. Lancer le build (Docker Desktop demarre) :

```powershell
.\scripts\build-android.ps1
```

APK produit : `generated/builds/apk/app-debug.apk`

### Installer sur telephone

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "generated\builds\apk\app-debug.apk"
```

## Partie B — GitHub Actions

Le workflow `.github/workflows/build-android.yml` se declenche sur `push` vers `main` ou `develop`.

### Configuration GitHub (recommandee)

Dans **Settings → Secrets and variables → Actions → Variables** :

| Variable | Valeur |
|----------|--------|
| `CAPACITOR_SERVER_URL` | `https://compta-pilot.vercel.app/setup` |
| `APP_NAME` | `Plateforme Compta` |
| `APP_ID` | `com.keyce.plateformecompta` |

Sans variable, le workflow utilise l'URL Vercel par defaut.

### Telecharger l'APK

1. GitHub → onglet **Actions**
2. Workflow **Build Android APK** termine (icone verte)
3. Section **Artifacts** → telecharger `app-debug-[sha]`

## Pousser les changements

```powershell
git add .
git commit -m "feat: pipeline mobile Capacitor Android"
git push origin main
```
