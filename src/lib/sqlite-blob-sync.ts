import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { head, put } from "@vercel/blob";

const BLOB_PATH = "compta-pilot/compta.db";

export function resolveSqliteFilePath(databaseUrl: string): string | null {
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

function sqliteFilePathFromEnv(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith("file:")) return null;
  return resolveSqliteFilePath(url);
}

function blobToken(): string | null {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export function isSqliteBlobSyncEnabled(): boolean {
  return Boolean(process.env.VERCEL && blobToken());
}

export async function downloadSqliteFromBlob(
  targetPath: string,
): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;

  try {
    const meta = await head(BLOB_PATH, { token });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return false;

    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch (err) {
    console.warn("[sqlite-blob] download failed:", err);
    return false;
  }
}

export async function uploadSqliteToBlob(filePath: string): Promise<void> {
  const token = blobToken();
  if (!token || !existsSync(filePath)) return;

  try {
    await put(BLOB_PATH, readFileSync(filePath), {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    console.warn("[sqlite-blob] upload failed:", err);
  }
}

let uploadTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSqliteBlobUpload(filePath: string): void {
  if (!isSqliteBlobSyncEnabled()) return;
  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => {
    uploadTimer = null;
    void uploadSqliteToBlob(filePath);
  }, 1500);
}

export function scheduleSqlitePersistence(): void {
  const filePath = sqliteFilePathFromEnv();
  if (filePath) scheduleSqliteBlobUpload(filePath);
}
