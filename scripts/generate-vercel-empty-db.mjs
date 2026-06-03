import { execSync } from "node:child_process";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../", import.meta.url)));
const dbPath = path.join(root, "prisma", "vercel-empty.db");
const prismaBin = path.join(
  root,
  "node_modules",
  "prisma",
  "build",
  "index.js",
);

if (existsSync(dbPath)) unlinkSync(dbPath);

execSync(`node "${prismaBin}" db push --skip-generate`, {
  env: { ...process.env, DATABASE_URL: "file:./vercel-empty.db" },
  stdio: "inherit",
  cwd: path.join(root, "prisma"),
});

const publicPath = path.join(root, "public", "vercel-empty.db");
copyFileSync(dbPath, publicPath);
console.log(`Templates crees : ${dbPath}, ${publicPath}`);
