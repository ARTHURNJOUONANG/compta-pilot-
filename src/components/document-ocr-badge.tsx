import { OcrStatus } from "@prisma/client";
import { ocrStatusLabel } from "@/lib/labels";
import { formatDateFr } from "@/lib/dates";
import { formatEuro } from "@/lib/ocr";
import { reprocessOcrAction } from "@/actions/documents";

const statusStyles: Record<OcrStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  PROCESSING: "bg-sky-100 text-sky-800",
  DONE: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-rose-100 text-rose-800",
  SKIPPED: "bg-slate-100 text-slate-500",
};

export type DocumentOcrFields = {
  id: string;
  ocrStatus: OcrStatus;
  ocrText: string | null;
  extractedAmount: number | null;
  extractedDate: Date | null;
  extractedVendor: string | null;
  extractedInvoiceNo: string | null;
  extractedSiret: string | null;
};

export function DocumentOcrBadge({ doc }: { doc: DocumentOcrFields }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[doc.ocrStatus]}`}
    >
      OCR : {ocrStatusLabel(doc.ocrStatus)}
    </span>
  );
}

export function DocumentOcrPanel({ doc }: { doc: DocumentOcrFields }) {
  const hasExtracted =
    doc.extractedAmount != null ||
    doc.extractedDate != null ||
    doc.extractedVendor ||
    doc.extractedInvoiceNo ||
    doc.extractedSiret;

  return (
    <div className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <DocumentOcrBadge doc={doc} />
        {(doc.ocrStatus === OcrStatus.FAILED ||
          doc.ocrStatus === OcrStatus.PENDING) && (
          <form action={reprocessOcrAction.bind(null, doc.id)}>
            <button
              type="submit"
              className="font-medium text-emerald-700 hover:underline"
            >
              Relancer l&apos;OCR
            </button>
          </form>
        )}
      </div>

      {doc.ocrStatus === OcrStatus.PROCESSING && (
        <p className="mt-2 text-slate-600">
          Extraction en cours… Actualisez la page dans quelques secondes.
        </p>
      )}

      {doc.ocrStatus === OcrStatus.DONE && hasExtracted && (
        <dl className="mt-2 grid gap-1 sm:grid-cols-2">
          {doc.extractedAmount != null && (
            <div>
              <dt className="text-slate-500">Montant détecté</dt>
              <dd className="font-semibold text-slate-900">
                {formatEuro(doc.extractedAmount)}
              </dd>
            </div>
          )}
          {doc.extractedDate && (
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-slate-900">
                {formatDateFr(doc.extractedDate)}
              </dd>
            </div>
          )}
          {doc.extractedVendor && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Émetteur</dt>
              <dd className="font-medium text-slate-900">{doc.extractedVendor}</dd>
            </div>
          )}
          {doc.extractedInvoiceNo && (
            <div>
              <dt className="text-slate-500">N° facture</dt>
              <dd className="font-medium text-slate-900">
                {doc.extractedInvoiceNo}
              </dd>
            </div>
          )}
          {doc.extractedSiret && (
            <div>
              <dt className="text-slate-500">SIRET</dt>
              <dd className="font-mono text-slate-900">{doc.extractedSiret}</dd>
            </div>
          )}
        </dl>
      )}

      {doc.ocrStatus === OcrStatus.DONE && doc.ocrText && (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium text-slate-700">
            Texte extrait
          </summary>
          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] leading-relaxed text-slate-600">
            {doc.ocrText}
          </pre>
        </details>
      )}

      {doc.ocrStatus === OcrStatus.FAILED && doc.ocrText && (
        <p className="mt-2 text-rose-700">{doc.ocrText}</p>
      )}

      {doc.ocrStatus === OcrStatus.SKIPPED && (
        <p className="mt-2 text-slate-500">
          OCR non applicable (Excel / CSV).
        </p>
      )}
    </div>
  );
}
