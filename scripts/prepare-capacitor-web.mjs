#!/usr/bin/env node
/**
 * Prépare le dossier out/ pour Capacitor sans export statique Next.js.
 * Utilisé quand l'app est full-stack (API, Prisma, middleware) et charge
 * l'instance déployée via CAPACITOR_SERVER_URL.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const serverUrl = process.env.CAPACITOR_SERVER_URL?.replace(/\/$/, "");
const appName = process.env.APP_NAME ?? "Plateforme Compta";

if (process.env.CAPACITOR_STATIC_EXPORT === "true") {
  console.log("Mode export statique : exécutez npm run build (next export) avant cap sync.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

const redirectBlock = serverUrl
  ? `<script>location.replace(${JSON.stringify(serverUrl)});</script>`
  : `<p>Configurez <code>CAPACITOR_SERVER_URL</code> dans le fichier <code>.env</code> à la racine du projet.</p>
     <p>Exemple : <code>https://votre-app.vercel.app</code></p>`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https: http: data: blob:;" />
  <title>${appName}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; text-align: center; padding: 1rem; }
    code { background: #1e293b; padding: 0.15rem 0.4rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div>
    <p>Chargement de ${appName}…</p>
    ${redirectBlock}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
console.log("✓ Assets Capacitor générés dans out/");
if (serverUrl) {
  console.log("  URL serveur :", serverUrl);
}
