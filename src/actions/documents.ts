"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { DocumentCategory, OcrStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  buildStoredName,
  classifyDocument,
  deleteStoredFile,
  saveUploadedFile,
  validateUpload,
} from "@/lib/documents";
import { runOcrForDocument, supportsOcr } from "@/lib/ocr";

const MAX_FILES_PER_UPLOAD = 10;

async function registerDocumentUpload(
  clientId: string,
  file: File,
  label: string | null,
  userId: string,
): Promise<{ id: string; ocr: boolean }> {
  const storedName = buildStoredName(file.name, file.type);
  const category = classifyDocument(file.name, file.type);

  await saveUploadedFile(clientId, storedName, file);

  const doc = await prisma.document.create({
    data: {
      clientId,
      fileName: file.name,
      storedName,
      mimeType: file.type,
      sizeBytes: file.size,
      category,
      label,
      uploadedById: userId,
      ocrStatus: supportsOcr(file.type) ? OcrStatus.PENDING : OcrStatus.SKIPPED,
    },
  });

  if (supportsOcr(file.type)) {
    after(async () => {
      await runOcrForDocument(doc.id);
      revalidatePath(`/clients/${clientId}`);
      revalidatePath("/documents");
      revalidatePath(`/documents/${doc.id}`);
    });
  }

  return { id: doc.id, ocr: supportsOcr(file.type) };
}

function collectFiles(formData: FormData): File[] {
  const fromMulti = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const single = formData.get("file");
  if (single instanceof File && single.size > 0) {
    return [...fromMulti, single];
  }
  return fromMulti;
}

export async function uploadDocumentsBulkAction(
  clientId: string,
  formData: FormData,
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) throw new Error("Client introuvable");

  const files = collectFiles(formData);
  if (files.length === 0) {
    redirect(
      `/clients/${clientId}?docError=${encodeURIComponent("Aucun fichier sélectionné")}`,
    );
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    redirect(
      `/clients/${clientId}?docError=${encodeURIComponent(`Maximum ${MAX_FILES_PER_UPLOAD} fichiers par dépôt`)}`,
    );
  }

  const sharedLabel = String(formData.get("label") ?? "").trim() || null;
  let ocrStarted = 0;
  const errors: string[] = [];

  for (const file of files) {
    const err = validateUpload(file);
    if (err) {
      errors.push(`${file.name} : ${err}`);
      continue;
    }
    const label =
      files.length === 1
        ? sharedLabel
        : sharedLabel
          ? `${sharedLabel} — ${file.name}`
          : null;
    const { ocr } = await registerDocumentUpload(
      clientId,
      file,
      label,
      user.id,
    );
    if (ocr) ocrStarted++;
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/documents");

  if (errors.length === files.length) {
    redirect(
      `/clients/${clientId}?docError=${encodeURIComponent(errors[0] ?? "Erreur")}`,
    );
  }

  const uploaded = files.length - errors.length;
  const params = new URLSearchParams({
    docUploaded: String(uploaded),
    ocrStarted: String(ocrStarted),
  });
  if (errors.length) params.set("docWarn", errors.join(" · "));

  const toDocuments = formData.get("redirectTo") === "documents";
  redirect(
    toDocuments
      ? `/documents?${params.toString()}`
      : `/clients/${clientId}?${params.toString()}`,
  );
}

export async function uploadDocumentFromHubAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) {
    redirect(
      `/documents?docError=${encodeURIComponent("Sélectionnez un client")}`,
    );
  }
  formData.set("redirectTo", "documents");
  await uploadDocumentsBulkAction(clientId, formData);
}

/** Compatibilité : dépôt d'un seul fichier (champ `file`). */
export async function uploadDocumentAction(
  clientId: string,
  formData: FormData,
) {
  await uploadDocumentsBulkAction(clientId, formData);
}

export async function reprocessOcrAction(documentId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { clientId: true, mimeType: true },
  });
  if (!doc) throw new Error("Document introuvable");
  if (!supportsOcr(doc.mimeType)) {
    throw new Error("OCR non disponible pour ce type de fichier");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { ocrStatus: OcrStatus.PENDING, ocrText: null },
  });

  await runOcrForDocument(documentId);

  revalidatePath(`/clients/${doc.clientId}`);
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}?ocrDone=1`);
}

export async function updateDocumentMetaAction(
  documentId: string,
  formData: FormData,
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { clientId: true },
  });
  if (!doc) throw new Error("Document introuvable");

  const label = String(formData.get("label") ?? "").trim() || null;
  const category = String(
    formData.get("category") ?? DocumentCategory.AUTRE,
  ) as DocumentCategory;

  if (!Object.values(DocumentCategory).includes(category)) {
    throw new Error("Catégorie invalide");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { label, category },
  });

  revalidatePath(`/clients/${doc.clientId}`);
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}?saved=1`);
}

export async function deleteDocumentAction(documentId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      clientId: true,
      storedName: true,
    },
  });
  if (!doc) throw new Error("Document introuvable");

  const canDeleteAny =
    user.role === Role.DIRECTOR || user.role === Role.MANAGER;
  if (!canDeleteAny && user.role === Role.COLLABORATOR) {
    const owned = await prisma.document.findFirst({
      where: { id: documentId, uploadedById: user.id },
    });
    if (!owned) throw new Error("Seuls vos documents peuvent être supprimés");
  }

  await deleteStoredFile(doc.clientId, doc.storedName);
  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath(`/clients/${doc.clientId}`);
  revalidatePath("/documents");
  redirect(`/clients/${doc.clientId}?docDeleted=1`);
}
