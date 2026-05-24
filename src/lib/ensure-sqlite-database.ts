import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SQLITE_TEMPLATE = path.join(process.cwd(), "prisma", "vercel-empty.db");

function resolveSqliteFilePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) return null;

  let filePath = databaseUrl.slice("file:".length);
  if (process.platform === "win32" && /^\/[a-zA-Z]:/.test(filePath)) {
    filePath = filePath.slice(1);
  }
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }
  return filePath;
}

let initPromise: Promise<void> | null = null;

function runDbPush(databaseUrl: string): void {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
    cwd: process.cwd(),
    timeout: 90_000,
  });
}

function seedFromTemplate(targetPath: string): void {
  if (!existsSync(SQLITE_TEMPLATE)) {
    throw new Error(
      `Base SQLite template introuvable (${SQLITE_TEMPLATE}). Exécutez: npm run db:template`,
    );
  }
  copyFileSync(SQLITE_TEMPLATE, targetPath);
}

async function sqliteHasUserTable(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name = 'User'
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function applySchema(filePath: string, databaseUrl: string): Promise<void> {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
  if (existsSync(SQLITE_TEMPLATE)) {
    seedFromTemplate(filePath);
    return;
  }
  runDbPush(databaseUrl);
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

  if (!(await sqliteHasUserTable())) {
    await applySchema(filePath, url);
  }
}

/** Crée le schéma SQLite si absent (requis sur Vercel /tmp éphémère). */
export function ensureSqliteDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = doEnsureSqliteDatabase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export function resetSqliteDatabaseInit(): void {
  initPromise = null;
}

export function isMissingTableError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021"
  );
}
