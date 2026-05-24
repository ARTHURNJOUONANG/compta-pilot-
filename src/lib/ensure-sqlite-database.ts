import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function templateCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "public", "vercel-empty.db"),
    path.join(cwd, "prisma", "vercel-empty.db"),
  ];
}

export function resolveSqliteTemplatePath(): string | null {
  for (const candidate of templateCandidates()) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

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

function runDbPushLocal(databaseUrl: string): void {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
    cwd: process.cwd(),
    timeout: 90_000,
  });
}

async function loadTemplateBytes(): Promise<Buffer> {
  const local = resolveSqliteTemplatePath();
  if (local) {
    return readFileSync(local);
  }

  const bases = [
    process.env.APP_URL?.replace(/\/$/, ""),
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ].filter(Boolean) as string[];

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/vercel-empty.db`, {
        cache: "no-store",
      });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch {
      // essayer la base suivante
    }
  }

  const searched = templateCandidates().join(", ");
  throw new Error(
    `Base SQLite template introuvable (${searched}) et fetch /vercel-empty.db échoué.`,
  );
}

async function writeTemplateTo(targetPath: string): Promise<void> {
  const bytes = await loadTemplateBytes();
  writeFileSync(targetPath, bytes);
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

async function replaceDatabaseFile(
  filePath: string,
  databaseUrl: string,
): Promise<void> {
  await prisma.$disconnect();

  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }

  const localTemplate = resolveSqliteTemplatePath();
  if (localTemplate) {
    copyFileSync(localTemplate, filePath);
    return;
  }

  if (process.env.VERCEL) {
    await writeTemplateTo(filePath);
    return;
  }

  runDbPushLocal(databaseUrl);
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

  // Copier AVANT toute requête Prisma si le fichier n'existe pas encore.
  if (!existsSync(filePath)) {
    const localTemplate = resolveSqliteTemplatePath();
    if (localTemplate) {
      copyFileSync(localTemplate, filePath);
    } else if (process.env.VERCEL) {
      await writeTemplateTo(filePath);
    } else {
      runDbPushLocal(url);
    }
    return;
  }

  if (!(await sqliteHasUserTable())) {
    await replaceDatabaseFile(filePath, url);
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
