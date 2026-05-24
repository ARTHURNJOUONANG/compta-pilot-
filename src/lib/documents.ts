import { createHash } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { DocumentCategory } from "@prisma/client";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "text/csv": ".csv",
};

export function uploadsRoot(): string {
  if (process.env.UPLOADS_DIR?.trim()) {
    return process.env.UPLOADS_DIR.trim();
  }
  return path.join(process.cwd(), "uploads");
}

export function clientUploadDir(clientId: string): string {
  return path.join(uploadsRoot(), clientId);
}

export function documentFilePath(clientId: string, storedName: string): string {
  return path.join(clientUploadDir(clientId), storedName);
}

export function classifyDocument(
  fileName: string,
  mimeType: string,
): DocumentCategory {
  const lower = fileName.toLowerCase();

  if (/facture|invoice|avoir|fact/.test(lower)) {
    return DocumentCategory.FACTURE;
  }
  if (/contrat|contract|bail|convention/.test(lower)) {
    return DocumentCategory.CONTRAT;
  }
  if (
    /tva|urssaf|dsn|liasse|justificatif|relev|bulletin|paie|social|fiscal/.test(
      lower,
    )
  ) {
    return DocumentCategory.JUSTIFICATIF;
  }
  if (mimeType.startsWith("image/")) {
    return DocumentCategory.FACTURE;
  }

  return DocumentCategory.AUTRE;
}

export function validateUpload(file: File): string | null {
  if (!file.size) return "Fichier vide.";
  if (file.size > MAX_DOCUMENT_BYTES) {
    return "Fichier trop volumineux (max 10 Mo).";
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return "Type non autorisé (PDF, images, Excel, CSV).";
  }
  return null;
}

export function buildStoredName(originalName: string, mimeType: string): string {
  const extFromName = path.extname(originalName).toLowerCase();
  const allowedExt = new Set([
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".xlsx",
    ".xls",
    ".csv",
  ]);
  const ext = allowedExt.has(extFromName)
    ? extFromName === ".jpeg"
      ? ".jpg"
      : extFromName
    : EXT_BY_MIME[mimeType] ?? "";

  const hash = createHash("sha256")
    .update(`${Date.now()}-${originalName}-${Math.random()}`)
    .digest("hex")
    .slice(0, 16);

  return `${hash}${ext}`;
}

export async function saveUploadedFile(
  clientId: string,
  storedName: string,
  file: File,
): Promise<void> {
  const dir = clientUploadDir(clientId);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(documentFilePath(clientId, storedName), buffer);
}

export async function deleteStoredFile(
  clientId: string,
  storedName: string,
): Promise<void> {
  try {
    await unlink(documentFilePath(clientId, storedName));
  } catch {
    // fichier déjà absent
  }
}

export async function deleteClientUploadDir(clientId: string): Promise<void> {
  const { rm } = await import("fs/promises");
  try {
    await rm(clientUploadDir(clientId), { recursive: true, force: true });
  } catch {
    // dossier absent
  }
}

export async function purgeClientDocuments(clientId: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  const docs = await prisma.document.findMany({
    where: { clientId },
    select: { storedName: true },
  });
  for (const d of docs) {
    await deleteStoredFile(clientId, d.storedName);
  }
  await deleteClientUploadDir(clientId);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
