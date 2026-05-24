import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

function resolveSqliteFilePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) return null;

  let filePath = databaseUrl.slice("file:".length);
  // file:/C:/path on Windows from env like file:/tmp/db (Unix-style on Vercel)
  if (process.platform === "win32" && /^\/[a-zA-Z]:/.test(filePath)) {
    filePath = filePath.slice(1);
  }
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }
  return filePath;
}

let initPromise: Promise<void> | null = null;

async function runDbPush(databaseUrl: string): Promise<void> {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
    cwd: process.cwd(),
    timeout: 90_000,
  });
}

async function doEnsureSqliteDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith("file:")) return;

  const filePath = resolveSqliteFilePath(url);
  if (!filePath) return;

  mkdirSync(path.dirname(filePath), { recursive: true });

  const uploadsDir =
    process.env.UPLOADS_DIR?.trim() ||
    path.join(path.dirname(filePath), "uploads");
  mkdirSync(uploadsDir, { recursive: true });

  if (existsSync(filePath)) return;

  await runDbPush(url);
}

/** Crée le fichier SQLite et le schéma si absent (requis sur Vercel /tmp éphémère). */
export function ensureSqliteDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = doEnsureSqliteDatabase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
