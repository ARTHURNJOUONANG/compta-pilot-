import { DocumentCategory } from "@prisma/client";
import {
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/actions/documents";
import { documentCategoryLabel } from "@/lib/labels";
import { formatFileSize } from "@/lib/documents";
import { formatDateFr } from "@/lib/dates";
import {
  DocumentOcrBadge,
  DocumentOcrPanel,
  type DocumentOcrFields,
} from "@/components/document-ocr-badge";

const categoryStyles: Record<DocumentCategory, string> = {
  FACTURE: "bg-violet-100 text-violet-900",
  JUSTIFICATIF: "bg-sky-100 text-sky-900",
  CONTRAT: "bg-amber-100 text-amber-900",
  AUTRE: "bg-slate-100 text-slate-800",
};

export type ClientDocumentRow = DocumentOcrFields & {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  label: string | null;
  createdAt: Date;
  uploadedById: string | null;
  uploadedBy: { name: string } | null;
};

export function ClientDocuments({
  clientId,
  documents,
  canDeleteAny,
  currentUserId,
}: {
  clientId: string;
  documents: ClientDocumentRow[];
  canDeleteAny: boolean;
  currentUserId: string;
}) {
  const byCategory = documents.reduce(
    (acc, doc) => {
      const key = doc.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    },
    {} as Partial<Record<DocumentCategory, ClientDocumentRow[]>>,
  );

  const categoryOrder: DocumentCategory[] = [
    DocumentCategory.FACTURE,
    DocumentCategory.JUSTIFICATIF,
    DocumentCategory.CONTRAT,
    DocumentCategory.AUTRE,
  ];

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Documents & factures
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Déposez les pièces par client — classement automatique et OCR des
          factures (PDF texte ou images).
        </p>
      </div>

      <form
        action={uploadDocumentAction.bind(null, clientId)}
        encType="multipart/form-data"
        className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4"
      >
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="doc-file"
          >
            Fichier *
          </label>
          <input
            id="doc-file"
            name="file"
            type="file"
            required
            accept=".pdf,image/jpeg,image/png,image/webp,.xlsx,.xls,.csv"
            className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF, images, Excel ou CSV — 10 Mo max. L&apos;OCR extrait montant,
            date, n° facture et SIRET.
          </p>
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="doc-label"
          >
            Libellé (optionnel)
          </label>
          <input
            id="doc-label"
            name="label"
            type="text"
            placeholder="ex. Facture fournisseur mars 2026"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Déposer le document
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun document pour ce client. Uploadez une facture ou un
          justificatif pour commencer.
        </p>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const items = byCategory[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  {documentCategoryLabel(cat)}
                  <span className="ml-2 font-normal text-slate-500">
                    ({items.length})
                  </span>
                </h3>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {items.map((doc) => {
                    const canDelete =
                      canDeleteAny || doc.uploadedById === currentUserId;

                    return (
                      <li
                        key={doc.id}
                        className="bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={`/api/documents/${doc.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate font-medium text-emerald-800 hover:underline"
                              >
                                {doc.label ?? doc.fileName}
                              </a>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[doc.category]}`}
                              >
                                {documentCategoryLabel(doc.category)}
                              </span>
                              <DocumentOcrBadge doc={doc} />
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {doc.fileName} · {formatFileSize(doc.sizeBytes)} ·{" "}
                              {formatDateFr(doc.createdAt)}
                              {doc.uploadedBy
                                ? ` · ${doc.uploadedBy.name}`
                                : ""}
                            </p>
                            <DocumentOcrPanel doc={doc} />
                          </div>
                          {canDelete && (
                            <form
                              action={deleteDocumentAction.bind(null, doc.id)}
                            >
                              <button
                                type="submit"
                                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                Supprimer
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
