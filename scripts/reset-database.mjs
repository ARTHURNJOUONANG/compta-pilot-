/**
 * Vide complètement la base SQLite locale et recrée le schéma vide.
 * Aucune donnée de démonstration n'est insérée — créez le cabinet via /setup.
 */
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const dbCandidates = [
  path.join(root, "dev.db"),
  path.join(root, "dev.db-journal"),
  path.join(root, "prisma", "dev.db"),
  path.join(root, "prisma", "dev.db-journal"),
];

for (const file of dbCandidates) {
  if (existsSync(file)) {
    unlinkSync(file);
    console.log(`Supprimé : ${path.relative(root, file)}`);
  }
}

execSync("npx prisma db push --skip-generate", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./dev.db" },
});

console.log("");
console.log("Base vidée. Prochaines étapes :");
console.log("  1. Redémarrez le serveur (npm run dev) si il tourne déjà");
console.log("  2. Ouvrez http://localhost:3000/setup");
console.log("  3. Créez le compte dirigeant (une seule fois)");
console.log("  4. Déconnexion → connexion via /login avec vos identifiants");
