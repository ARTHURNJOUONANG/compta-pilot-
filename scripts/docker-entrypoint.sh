#!/bin/bash
set -e
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}▶ $1${NC}"; }
log_ok()   { echo -e "${GREEN}✓ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

APP_DIR="/workspace"

log_step "Installation des dépendances Node.js..."
cd "$APP_DIR"
npm ci --prefer-offline 2>/dev/null || npm install
log_ok "Dépendances installées"

if [ "${CAPACITOR_STATIC_EXPORT}" = "true" ]; then
  log_step "Build Next.js en mode export statique..."
  npm run build
  if [ ! -d "out" ]; then
    log_err "Le dossier out/ n'existe pas. Vérifiez next.config (output: 'export')."
  fi
  log_ok "Build Next.js terminé — dossier out/ généré"
else
  log_step "Préparation des assets web Capacitor (mode WebView + URL distante)..."
  npm run cap:prepare
  if [ ! -d "out" ]; then
    log_err "Le dossier out/ n'a pas été créé."
  fi
  if [ -z "${CAPACITOR_SERVER_URL}" ]; then
    log_warn "CAPACITOR_SERVER_URL non défini — l'APK affichera un écran de configuration."
  else
    log_ok "Capacitor pointera vers : ${CAPACITOR_SERVER_URL}"
  fi
fi

log_step "Ajout de la plateforme Android..."
if [ -d "android" ]; then
  log_warn "Ancien dossier android/ détecté, suppression..."
  rm -rf android
fi
npx cap add android
log_ok "Plateforme Android ajoutée"

log_step "Synchronisation des assets web vers Android..."
npx cap sync android
log_ok "Synchronisation terminée"

log_step "Compilation de l'APK Android..."
cd "$APP_DIR/android"
chmod +x gradlew
./gradlew assembleDebug \
  --no-daemon \
  --stacktrace \
  -Dorg.gradle.jvmargs="-Xmx2g"
log_ok "Compilation terminée"

log_step "Déplacement de l'APK..."
APK_SOURCE="$APP_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="/workspace/generated/builds/apk"
SOURCE_DEST="/workspace/generated/source"

mkdir -p "$APK_DEST"
mkdir -p "$SOURCE_DEST"

cp "$APK_SOURCE" "$APK_DEST/app-debug.apk"
cp -r "$APP_DIR/android" "$SOURCE_DEST/"

APK_SIZE=$(du -sh "$APK_DEST/app-debug.apk" | cut -f1)

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  BUILD ANDROID TERMINÉ AVEC SUCCÈS${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "  APK     : generated/builds/apk/app-debug.apk"
echo -e "  Taille  : $APK_SIZE"
echo -e "  Source  : generated/source/android/"
echo -e "${GREEN}════════════════════════════════════════${NC}"
