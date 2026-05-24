import { DocumentCategory, OcrStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatFileSize } from "@/lib/documents";

export type StorageStats = {
  totalFiles: number;
  totalBytes: number;
  totalBytesLabel: string;
  byCategory: { category: DocumentCategory; count: number; bytes: number }[];
  ocrPending: number;
  ocrDone: number;
  invoicesWithAmount: number;
  totalExtractedAmount: number;
};

export async function getStorageStats(): Promise<StorageStats> {
  const [totalAgg, byCategory, ocrCounts, amountAgg] = await Promise.all([
    prisma.document.aggregate({
      _count: true,
      _sum: { sizeBytes: true },
    }),
    prisma.document.groupBy({
      by: ["category"],
      _count: true,
      _sum: { sizeBytes: true },
    }),
    prisma.document.groupBy({
      by: ["ocrStatus"],
      _count: true,
    }),
    prisma.document.aggregate({
      where: {
        category: DocumentCategory.FACTURE,
        extractedAmount: { not: null },
      },
      _count: true,
      _sum: { extractedAmount: true },
    }),
  ]);

  const totalBytes = totalAgg._sum.sizeBytes ?? 0;
  const ocrMap = Object.fromEntries(
    ocrCounts.map((r) => [r.ocrStatus, r._count]),
  ) as Partial<Record<OcrStatus, number>>;

  return {
    totalFiles: totalAgg._count,
    totalBytes,
    totalBytesLabel: formatFileSize(totalBytes),
    byCategory: byCategory.map((r) => ({
      category: r.category,
      count: r._count,
      bytes: r._sum.sizeBytes ?? 0,
    })),
    ocrPending:
      (ocrMap.PENDING ?? 0) +
      (ocrMap.PROCESSING ?? 0) +
      (ocrMap.FAILED ?? 0),
    ocrDone: ocrMap.DONE ?? 0,
    invoicesWithAmount: amountAgg._count,
    totalExtractedAmount: amountAgg._sum.extractedAmount ?? 0,
  };
}

export function buildDocumentSearchWhere(
  q: string,
  category?: DocumentCategory,
  ocrFilter?: string,
): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {};

  if (category) where.category = category;

  if (ocrFilter === "pending") {
    where.ocrStatus = { in: [OcrStatus.PENDING, OcrStatus.PROCESSING, OcrStatus.FAILED] };
  } else if (ocrFilter === "done") {
    where.ocrStatus = OcrStatus.DONE;
  }

  const term = q.trim();
  if (term) {
    where.OR = [
      { fileName: { contains: term } },
      { label: { contains: term } },
      { extractedVendor: { contains: term } },
      { extractedInvoiceNo: { contains: term } },
      { client: { name: { contains: term } } },
    ];
  }

  return where;
}
