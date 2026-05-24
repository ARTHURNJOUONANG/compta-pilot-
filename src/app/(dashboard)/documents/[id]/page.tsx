import Link from "next/link";
import { DocumentCategory } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import {
  deleteDocumentAction,
  reprocessOcrAction,
  updateDocumentMetaAction,
} from "@/actions/documents";
import { DocumentOcrPanel } from "@/components/document-ocr-badge";
import { FlashBanner } from "@/components/flash-banner";
import { getSessionUser } from "@/lib/auth";
import { formatEuro } from "@/lib/currency";
import { formatDateFr } from "@/lib/dates";
import { formatFileSize } from "@/lib/documents";
import { documentCategoryLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; ocrDone?: string }>;
};

export default async function DocumentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      uploadedBy: { select: { name: true } },
    },
  });
  if (!doc) notFound();

  const canDelete =
    user.role === Role.DIRECTOR ||
    user.role === Role.MANAGER ||
    doc.uploadedById === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/documents"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Coffre-fort
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {doc.label ?? doc.fileName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <Link
              href={`/clients/${doc.client.id}`}
              className="font-medium text-emerald-800 hover:underline"
            >
              {doc.client.name}
            </Link>
            {" · "}
            {formatFileSize(doc.sizeBytes)} · déposé le{" "}
            {formatDateFr(doc.createdAt)}
            {doc.uploadedBy ? ` par ${doc.uploadedBy.name}` : ""}
          </p>
        </div>
        <a
          href={`/api/documents/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Ouvrir / télécharger
        </a>
      </div>

      {sp.saved === "1" && (
        <FlashBanner message="Métadonnées enregistrées." variant="success" />
      )}
      {sp.ocrDone === "1" && (
        <FlashBanner message="OCR relancé — consultez les champs extraits ci-dessous." variant="success" />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Extraction intelligente (OCR)
        </h2>
        <div className="mt-4">
          <DocumentOcrPanel doc={doc} />
        </div>
        {doc.extractedAmount != null && (
          <p className="mt-4 text-sm text-slate-600">
            Montant détecté pour rapprochement comptable :{" "}
            <strong className="text-slate-900">
              {formatEuro(doc.extractedAmount)}
            </strong>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Métadonnées</h2>
        <form action={updateDocumentMetaAction.bind(null, doc.id)} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="label">
              Libellé
            </label>
            <input
              id="label"
              name="label"
              defaultValue={doc.label ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="category">
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              defaultValue={doc.category}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.values(DocumentCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {documentCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Fichier original : {doc.fileName} ({doc.mimeType})
          </p>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Enregistrer
          </button>
        </form>
      </section>

      {canDelete && (
        <form action={deleteDocumentAction.bind(null, doc.id)}>
          <button
            type="submit"
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Supprimer du coffre-fort
          </button>
        </form>
      )}
    </div>
  );
}
