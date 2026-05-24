import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireApiRole, requireApiUser } from "@/lib/api-auth";
import { buildCsv } from "@/lib/export-csv";
import { formatDateFr } from "@/lib/dates";
import { formatFileSize } from "@/lib/documents";
import { documentCategoryLabel, ocrStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const denied = requireApiRole(auth, [
    Role.DIRECTOR,
    Role.MANAGER,
    Role.COLLABORATOR,
  ]);
  if (denied) return denied;

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      uploadedBy: { select: { name: true } },
    },
  });

  const csv = buildCsv(
    [
      "Libellé",
      "Fichier",
      "Client",
      "Catégorie",
      "Taille",
      "OCR",
      "Montant extrait",
      "Date facture",
      "Fournisseur",
      "N° facture",
      "SIRET",
      "Déposé le",
      "Par",
    ],
    documents.map((d) => [
      d.label ?? "",
      d.fileName,
      d.client.name,
      documentCategoryLabel(d.category),
      formatFileSize(d.sizeBytes),
      ocrStatusLabel(d.ocrStatus),
      d.extractedAmount != null ? String(d.extractedAmount) : "",
      d.extractedDate ? formatDateFr(d.extractedDate) : "",
      d.extractedVendor ?? "",
      d.extractedInvoiceNo ?? "",
      d.extractedSiret ?? "",
      formatDateFr(d.createdAt),
      d.uploadedBy?.name ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventaire-documents-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
