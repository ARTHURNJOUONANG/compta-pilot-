import PDFDocument from "pdfkit";

type PDFDoc = InstanceType<typeof PDFDocument>;
import type { Contract, Client } from "@prisma/client";
import { formatDateFr } from "@/lib/dates";
import { contractTemplateLabel } from "@/lib/contracts";

export type ContractPdfSource = Contract & {
  client: Pick<Client, "name" | "email" | "siret">;
};

const MARGIN = 62;
const PAGE_W = 595.28; // A4 pt
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR = {
  black: "#111111",
  blue: "#1d4ed8",
  gray: "#64748b",
  line: "#334155",
};

const FONT = {
  regular: "Times-Roman",
  bold: "Times-Bold",
  italic: "Times-Italic",
  boldItalic: "Times-BoldItalic",
} as const;

function decodeSignature(dataUrl: string | null): Buffer | null {
  if (!dataUrl?.startsWith("data:image")) return null;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

function safeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "contrat";
}

export function contractPdfFilename(contract: ContractPdfSource): string {
  const date = contract.signedAt
    ? contract.signedAt.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return `contrat-${safeFilename(contract.client.name)}-${date}.pdf`;
}

function fieldValues(contract: ContractPdfSource): string[] {
  let fields: Record<string, string> = {};
  try {
    fields = JSON.parse(contract.fieldsJson) as Record<string, string>;
  } catch {
    /* ignore */
  }
  const vals = new Set<string>();
  for (const v of Object.values(fields)) {
    const t = v?.trim();
    if (t && t !== "—") vals.add(t);
  }
  if (contract.cabinetSigner?.trim()) vals.add(contract.cabinetSigner.trim());
  if (contract.clientSigner?.trim()) vals.add(contract.clientSigner.trim());
  if (contract.client.name?.trim()) vals.add(contract.client.name.trim());
  if (contract.client.siret?.trim()) vals.add(contract.client.siret.trim());
  return [...vals].sort((a, b) => b.length - a.length);
}

type LineKind =
  | "title"
  | "article"
  | "heading"
  | "part"
  | "intro"
  | "signature"
  | "body"
  | "blank";

function classifyLine(line: string, isFirstTitle: boolean): LineKind {
  const t = line.trim();
  if (!t) return "blank";
  if (
    isFirstTitle &&
    (t.length < 80 && /^[A-ZÉÈÊÀÂÔÙÇ0-9\s'’\-—:]+$/u.test(t))
  ) {
    return "title";
  }
  if (/^Article\s+\d+/i.test(t)) return "article";
  if (/^(Entre les soussignés|Il a été convenu)/i.test(t)) return "heading";
  if (/^(D'une part|D'autre part)/i.test(t)) return "part";
  if (/^Et$/i.test(t)) return "intro";
  if (/^(Pour le|Fait à|Signatures)/i.test(t)) return "signature";
  return "body";
}

function ensureSpace(doc: PDFDoc, needed: number) {
  const bottom = doc.page.height - MARGIN - 48;
  if (doc.y + needed > bottom) doc.addPage();
}

function drawDoubleBorderTitle(doc: PDFDoc, title: string) {
  const boxH = 52;
  ensureSpace(doc, boxH + 24);
  const y = doc.y;
  const x = MARGIN;
  const w = CONTENT_W;

  doc.lineWidth(1.2).strokeColor(COLOR.line);
  doc.rect(x, y, w, boxH).stroke();
  doc.rect(x + 4, y + 4, w - 8, boxH - 8).stroke();

  doc
    .font(FONT.bold)
    .fontSize(15)
    .fillColor(COLOR.black)
    .text(title, x + 12, y + 16, {
      width: w - 24,
      align: "center",
    });

  doc.y = y + boxH + 20;
}

function drawArticleHeader(doc: PDFDoc, text: string) {
  ensureSpace(doc, 36);
  doc.font(FONT.bold).fontSize(11.5).fillColor(COLOR.black);
  const tw = doc.widthOfString(text);
  const x = MARGIN + (CONTENT_W - tw) / 2;
  const y = doc.y;
  doc.text(text, x, y, { underline: true, lineBreak: false });
  doc.moveDown(1.1);
}

function drawHeading(doc: PDFDoc, text: string, italic = false) {
  ensureSpace(doc, 22);
  doc
    .font(italic ? FONT.boldItalic : FONT.bold)
    .fontSize(11)
    .fillColor(COLOR.black)
    .text(text, MARGIN, doc.y, { width: CONTENT_W, align: "left" });
  doc.moveDown(0.6);
}

function drawPartLabel(doc: PDFDoc, text: string) {
  ensureSpace(doc, 18);
  doc.font(FONT.bold).fontSize(11).fillColor(COLOR.black).text(text, {
    width: CONTENT_W,
    align: "left",
  });
  doc.moveDown(0.5);
}

function renderHighlightedLine(
  doc: PDFDoc,
  line: string,
  highlights: string[],
) {
  ensureSpace(doc, 20);
  const y0 = doc.y;
  let x = MARGIN;
  const maxX = MARGIN + CONTENT_W;
  const lineH = 14;
  const fontSize = 11;

  doc.fontSize(fontSize);

  let remaining = line;
  const parts: { text: string; highlight: boolean }[] = [];

  while (remaining.length > 0) {
    let found: { index: number; value: string } | null = null;
    for (const h of highlights) {
      const idx = remaining.indexOf(h);
      if (idx !== -1 && (found === null || idx < found.index)) {
        found = { index: idx, value: h };
      }
    }
    if (!found) {
      parts.push({ text: remaining, highlight: false });
      break;
    }
    if (found.index > 0) {
      parts.push({ text: remaining.slice(0, found.index), highlight: false });
    }
    parts.push({ text: found.value, highlight: true });
    remaining = remaining.slice(found.index + found.value.length);
  }

  for (const part of parts) {
    doc.font(part.highlight ? FONT.italic : FONT.regular);
    doc.fillColor(part.highlight ? COLOR.blue : COLOR.black);

    const words = part.text.split(/(\s+)/);
    for (const w of words) {
      if (!w) continue;
      const ww = doc.widthOfString(w);
      if (x + ww > maxX && x > MARGIN) {
        x = MARGIN;
        doc.y += lineH;
        ensureSpace(doc, lineH);
      }
      doc.text(w, x, doc.y, { lineBreak: false });
      x += ww;
    }
  }

  doc.x = MARGIN;
  doc.y = y0 + lineH + 4;
  doc.fillColor(COLOR.black);
}

function drawBodyLine(doc: PDFDoc, line: string, highlights: string[]) {
  if (!line.trim()) {
    doc.moveDown(0.35);
    return;
  }
  renderHighlightedLine(doc, line, highlights);
}

function drawMetaBlock(doc: PDFDoc, contract: ContractPdfSource) {
  ensureSpace(doc, 50);
  doc
    .font(FONT.italic)
    .fontSize(9.5)
    .fillColor(COLOR.gray)
    .text(contractTemplateLabel(contract.templateType), {
      width: CONTENT_W,
      align: "center",
    });
  doc.moveDown(0.8);

  const lines: string[] = [];
  if (contract.client.siret) lines.push(`SIRET client : ${contract.client.siret}`);
  if (contract.signedAt) {
    lines.push(`Date de signature : ${formatDateFr(contract.signedAt)}`);
  }
  if (lines.length) {
    doc.font(FONT.regular).fontSize(9).fillColor(COLOR.gray).text(lines.join("  ·  "), {
      width: CONTENT_W,
      align: "center",
    });
    doc.moveDown(1);
  }
  doc.fillColor(COLOR.black);

  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + CONTENT_W, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cbd5e1")
    .stroke();
  doc.moveDown(1.2);
}

function drawSignaturesBlock(doc: PDFDoc, contract: ContractPdfSource) {
  ensureSpace(doc, 160);
  doc.moveDown(1.5);

  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + CONTENT_W, doc.y)
    .lineWidth(0.5)
    .strokeColor("#cbd5e1")
    .stroke();
  doc.moveDown(1);

  const dateStr = contract.signedAt
    ? formatDateFr(contract.signedAt)
    : new Date().toLocaleDateString("fr-FR");
  doc.font(FONT.regular).fontSize(11).fillColor(COLOR.black);
  doc.text(`Fait à ___________________________, le ${dateStr}`, {
    width: CONTENT_W,
  });
  doc.moveDown(1.2);

  const colW = CONTENT_W / 2 - 16;
  const yRow = doc.y;
  const xLeft = MARGIN;
  const xRight = MARGIN + CONTENT_W / 2 + 8;

  doc.font(FONT.bold).fontSize(11);
  doc.text("Pour le Cabinet", xLeft, yRow, { width: colW });
  doc.text("Pour le Client", xRight, yRow, { width: colW });

  const sigY = yRow + 18;
  const cabinetImg = decodeSignature(contract.cabinetSignature);
  const clientImg = decodeSignature(contract.clientSignature);

  if (cabinetImg) {
    try {
      doc.image(cabinetImg, xLeft, sigY, { width: colW, height: 52 });
    } catch {
      doc.font(FONT.italic).fontSize(9).text("[Signature]", xLeft, sigY);
    }
  }
  if (clientImg) {
    try {
      doc.image(clientImg, xRight, sigY, { width: colW, height: 52 });
    } catch {
      doc.font(FONT.italic).fontSize(9).text("[Signature]", xRight, sigY);
    }
  }

  doc.y = sigY + 58;
  doc.font(FONT.italic).fontSize(10).fillColor(COLOR.blue);
  if (contract.cabinetSigner) {
    doc.text(contract.cabinetSigner, xLeft, doc.y, { width: colW });
  }
  if (contract.clientSigner) {
    doc.text(
      contract.clientSigner,
      xRight,
      contract.cabinetSigner ? doc.y - 12 : doc.y,
      { width: colW },
    );
  }
  doc.fillColor(COLOR.black);
  doc.moveDown(1);
}

function renderContractContent(
  doc: PDFDoc,
  contract: ContractPdfSource,
  highlights: string[],
) {
  const lines = (contract.renderedBody || "").split(/\r?\n/);
  let titleDrawn = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const kind = classifyLine(line, !titleDrawn);

    if (kind === "blank") {
      doc.moveDown(0.4);
      continue;
    }

    if (kind === "title" && !titleDrawn) {
      drawDoubleBorderTitle(doc, line.trim());
      drawMetaBlock(doc, contract);
      titleDrawn = true;
      continue;
    }

    if (kind === "article") {
      drawArticleHeader(doc, line.trim());
      continue;
    }

    if (kind === "heading") {
      drawHeading(doc, line.trim(), /convenu/i.test(line));
      continue;
    }

    if (kind === "part") {
      drawPartLabel(doc, line.trim());
      continue;
    }

    if (kind === "intro") {
      ensureSpace(doc, 18);
      doc.font(FONT.bold).fontSize(11).text("Et", { width: CONTENT_W });
      doc.moveDown(0.5);
      continue;
    }

    if (kind === "signature") {
      drawBodyLine(doc, line, highlights);
      continue;
    }

    drawBodyLine(doc, line, highlights);
  }

  if (!titleDrawn) {
    drawDoubleBorderTitle(doc, contract.title);
    drawMetaBlock(doc, contract);
  }
}

export async function generateContractPdfBuffer(
  contract: ContractPdfSource,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: contract.title,
        Author: "Compta Pilot",
        Subject: contractTemplateLabel(contract.templateType),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const highlights = fieldValues(contract);
    renderContractContent(doc, contract, highlights);
    drawSignaturesBlock(doc, contract);

    const footerY = doc.page.height - MARGIN + 8;
    doc
      .font(FONT.regular)
      .fontSize(8)
      .fillColor(COLOR.gray)
      .text(
        `Document généré par Compta Pilot — ${new Date().toLocaleString("fr-FR")}`,
        MARGIN,
        footerY,
        { width: CONTENT_W, align: "center" },
      );

    doc.end();
  });
}
