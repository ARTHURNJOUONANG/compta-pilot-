import { readFile } from "fs/promises";
import { OcrStatus } from "@prisma/client";
import { createWorker } from "tesseract.js";
import { prisma } from "@/lib/prisma";
import { formatEuro } from "@/lib/currency";
import { documentFilePath } from "@/lib/documents";
import { notifyOcrCompleted } from "@/lib/notifications";

const MIN_PDF_TEXT_CHARS = 40;
const MAX_PDF_OCR_PAGES = 2;

export type ExtractedInvoiceFields = {
  amount: number | null;
  date: Date | null;
  vendor: string | null;
  invoiceNumber: string | null;
  siret: string | null;
};

const OCR_SUPPORTED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function supportsOcr(mimeType: string): boolean {
  return OCR_SUPPORTED.has(mimeType);
}

function parseFrenchAmount(raw: string): number {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function parseInvoiceFields(text: string): ExtractedInvoiceFields {
  const flat = text.replace(/\r/g, "\n");

  let amount: number | null = null;
  const amountPatterns = [
    /(?:total\s*ttc|montant\s*ttc|net\s*à\s*payer|à\s*payer|total\s*général|total\s*du)[^\d\n]{0,30}(\d{1,3}(?:[\s\u00a0]\d{3})*[,.]\d{2})/gi,
    /(\d{1,3}(?:[\s\u00a0]\d{3})*[,.]\d{2})\s*(?:€|eur\b)/gi,
  ];
  let bestAmount = 0;
  for (const pattern of amountPatterns) {
    for (const match of flat.matchAll(pattern)) {
      const val = parseFrenchAmount(match[1]);
      if (val > bestAmount) bestAmount = val;
    }
  }
  if (bestAmount > 0) amount = bestAmount;

  let date: Date | null = null;
  const dateMatch = flat.match(
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
  );
  if (dateMatch) {
    const day = Number.parseInt(dateMatch[1], 10);
    const month = Number.parseInt(dateMatch[2], 10) - 1;
    let year = Number.parseInt(dateMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) date = d;
  }

  let invoiceNumber: string | null = null;
  const invMatch = flat.match(
    /(?:facture|invoice|n°|no\.?|réf\.?|ref\.?)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i,
  );
  if (invMatch) invoiceNumber = invMatch[1].trim();

  let siret: string | null = null;
  const siretMatch = flat.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/);
  if (siretMatch) siret = siretMatch[1].replace(/\s/g, "");

  let vendor: string | null = null;
  const lines = flat
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 80);
  const vendorLine = lines.find((l) =>
    /\b(sarl|sas|eurl|sa|sasu|snc|cabinet|entreprise)\b/i.test(l),
  );
  if (vendorLine) {
    vendor = vendorLine.slice(0, 120);
  } else if (lines[0] && !/^\d+$/.test(lines[0])) {
    vendor = lines[0].slice(0, 120);
  }

  return { amount, date, vendor, invoiceNumber, siret };
}

async function extractPdfText(filePath: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractImageText(filePath: string): Promise<string> {
  const worker = await createWorker("fra");
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return text ?? "";
  } finally {
    await worker.terminate();
  }
}

async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  const worker = await createWorker("fra");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text ?? "";
  } finally {
    await worker.terminate();
  }
}

/** OCR sur PDF scanné : rendu des pages en images puis Tesseract. */
async function extractScannedPdfText(filePath: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const screenshots = await parser.getScreenshot({
      first: MAX_PDF_OCR_PAGES,
      imageBuffer: true,
      desiredWidth: 1400,
    });

    const parts: string[] = [];
    for (const page of screenshots.pages) {
      if (!page.data?.length) continue;
      const text = await ocrImageBuffer(Buffer.from(page.data));
      if (text.trim()) parts.push(text.trim());
    }
    return parts.join("\n\n");
  } finally {
    await parser.destroy();
  }
}

async function extractText(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfText = await extractPdfText(filePath);
    if (pdfText.trim().length >= MIN_PDF_TEXT_CHARS) return pdfText;

    try {
      const ocrText = await extractScannedPdfText(filePath);
      if (ocrText.trim().length > 0) {
        const header = pdfText.trim()
          ? `${pdfText.trim()}\n\n--- OCR (PDF scanné) ---\n\n`
          : "";
        return header + ocrText;
      }
    } catch {
      // repli sur message ci-dessous
    }

    return (
      pdfText.trim() ||
      "[PDF scanné — OCR image impossible. Essayez une photo JPG/PNG de la facture.]"
    );
  }
  if (mimeType.startsWith("image/")) {
    return extractImageText(filePath);
  }
  return "";
}

export async function runOcrForDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      clientId: true,
      storedName: true,
      mimeType: true,
      fileName: true,
      uploadedById: true,
    },
  });
  if (!doc) return;

  if (!supportsOcr(doc.mimeType)) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrStatus: OcrStatus.SKIPPED,
        ocrProcessedAt: new Date(),
      },
    });
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { ocrStatus: OcrStatus.PROCESSING },
  });

  try {
    const filePath = documentFilePath(doc.clientId, doc.storedName);
    const text = await extractText(filePath, doc.mimeType);
    const trimmed = text.trim();
    const extracted = parseInvoiceFields(trimmed);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrStatus: OcrStatus.DONE,
        ocrText: trimmed.slice(0, 15000) || null,
        ocrProcessedAt: new Date(),
        extractedAmount: extracted.amount,
        extractedDate: extracted.date,
        extractedVendor: extracted.vendor,
        extractedInvoiceNo: extracted.invoiceNumber,
        extractedSiret: extracted.siret,
      },
    });

    const summaryParts: string[] = [];
    if (extracted.amount != null) summaryParts.push(formatEuro(extracted.amount));
    if (extracted.invoiceNumber) {
      summaryParts.push(`N° ${extracted.invoiceNumber}`);
    }
    if (extracted.vendor) summaryParts.push(extracted.vendor);

    await notifyOcrCompleted({
      documentId: doc.id,
      clientId: doc.clientId,
      fileName: doc.fileName,
      uploadedById: doc.uploadedById,
      summary: summaryParts.join(" · ") || "Texte extrait (champs structurés non détectés)",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur OCR inconnue";
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrStatus: OcrStatus.FAILED,
        ocrText: message.slice(0, 500),
        ocrProcessedAt: new Date(),
      },
    });
  }
}

export { formatEuro } from "@/lib/currency";
