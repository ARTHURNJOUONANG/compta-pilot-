"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { OcrStatus, Role } from "@prisma/client";
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

export async function uploadDocumentAction(
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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Aucun fichier sélectionné");
  }

  const error = validateUpload(file);
  if (error) {
    redirect(`/clients/${clientId}?docError=${encodeURIComponent(error)}`);
  }

  const label = String(formData.get("label") ?? "").trim() || null;
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
      uploadedById: user.id,
      ocrStatus: supportsOcr(file.type) ? OcrStatus.PENDING : OcrStatus.SKIPPED,
    },
  });

  if (supportsOcr(file.type)) {
    after(async () => {
      await runOcrForDocument(doc.id);
      revalidatePath(`/clients/${clientId}`);
      revalidatePath("/documents");
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/documents");
  const ocrParam = supportsOcr(file.type) ? "&ocrStarted=1" : "";
  redirect(`/clients/${clientId}?docUploaded=1${ocrParam}`);
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
  redirect(`/clients/${doc.clientId}?ocrDone=1`);
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
  redirect(`/clients/${doc.clientId}?docDeleted=1`);
}
