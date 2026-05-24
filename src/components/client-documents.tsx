import { DocumentCategory } from "@prisma/client";
import {
  deleteDocumentAction,
  uploadDocumentsBulkAction,
} from "@/actions/documents";
import { DocumentUploadZone } from "@/components/document-upload-zone";
import { documentCategoryLabel } from "@/lib/labels";
import { formatFileSize } from "@/lib/documents";
import { formatDateFr } from "@/lib/dates";
import {
  DocumentOcrBadge,
  DocumentOcrPanel,
  type DocumentOcrFields,
} from "@/components/document-ocr-badge";
import Link from "next/link";

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
  clientName,
  documents,
  canDeleteAny,
  currentUserId,
}: {
  clientId: string;
  clientName: string;
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Coffre-fort — {clientName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Stockage sécurisé des pièces du dossier : multi-dépôt, classement auto
            et OCR facture.
          </p>
        </div>
        <Link
          href="/documents"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Vue globale →
        </Link>
      </div>

      <DocumentUploadZone
        action={uploadDocumentsBulkAction.bind(null, clientId)}
        fixedClientId={clientId}
        fixedClientName={clientName}
      />

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun document pour ce client. Déposez une facture PDF ou une photo pour
          tester l&apos;OCR.
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
                      <li key={doc.id} className="bg-white px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="truncate font-medium text-emerald-800 hover:underline"
                              >
                                {doc.label ?? doc.fileName}
                              </Link>
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
                          <div className="flex flex-col gap-1">
                            <a
                              href={`/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Ouvrir
                            </a>
                            {canDelete && (
                              <form
                                action={deleteDocumentAction.bind(null, doc.id)}
                              >
                                <button
                                  type="submit"
                                  className="w-full rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                >
                                  Supprimer
                                </button>
                              </form>
                            )}
                          </div>
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
