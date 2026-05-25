import Link from "next/link";
import { DocumentCategory } from "@prisma/client";
import { uploadDocumentFromHubAction } from "@/actions/documents";
import { DocumentUploadZone } from "@/components/document-upload-zone";
import { DocumentOcrBadge } from "@/components/document-ocr-badge";
import { FlashBanner } from "@/components/flash-banner";
import { documentCategoryLabel } from "@/lib/labels";
import { formatDateFr } from "@/lib/dates";
import { formatFileSize } from "@/lib/documents";
import { formatEuro } from "@/lib/currency";
import {
  buildDocumentSearchWhere,
  getStorageStats,
} from "@/lib/document-storage";
import { prisma } from "@/lib/prisma";

const categoryStyles: Record<DocumentCategory, string> = {
  FACTURE: "bg-violet-100 text-violet-900",
  JUSTIFICATIF: "bg-sky-100 text-sky-900",
  CONTRAT: "bg-amber-100 text-amber-900",
  AUTRE: "bg-slate-100 text-slate-800",
};

type Props = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    ocr?: string;
    docError?: string;
    docUploaded?: string;
    docWarn?: string;
    ocrStarted?: string;
  }>;
};

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryFilter =
    sp.category &&
    Object.values(DocumentCategory).includes(sp.category as DocumentCategory)
      ? (sp.category as DocumentCategory)
      : undefined;
  const ocrFilter = sp.ocr;
  const q = sp.q ?? "";

  const [stats, clients, documents] = await Promise.all([
    getStorageStats(),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.document.findMany({
      where: buildDocumentSearchWhere(q, categoryFilter, ocrFilter),
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
  ]);

  const uploadedCount = Number.parseInt(sp.docUploaded ?? "", 10);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Coffre-fort documentaire
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Stockage centralisé par dossier client : dépôt multi-fichiers,
          classement automatique (facture, justificatif, contrat), OCR intelligent
          sur PDF et images (montant, date, SIRET, n° facture).
        </p>
      </header>

      {sp.docError && (
        <FlashBanner message={decodeURIComponent(sp.docError)} variant="info" />
      )}
      {sp.docWarn && (
        <FlashBanner message={decodeURIComponent(sp.docWarn)} variant="info" />
      )}
      {!Number.isNaN(uploadedCount) && sp.docUploaded && (
        <FlashBanner
          message={`${uploadedCount} document(s) archivé(s).${Number(sp.ocrStarted) > 0 ? ` OCR lancé sur ${sp.ocrStarted} fichier(s).` : ""}`}
          variant="success"
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fichiers archivés"
          value={String(stats.totalFiles)}
          hint={stats.totalBytesLabel}
        />
        <StatCard
          label="Montants OCR (factures)"
          value={formatEuro(stats.totalExtractedAmount)}
          hint={`${stats.invoicesWithAmount} facture(s) lue(s)`}
        />
        <StatCard
          label="OCR terminés"
          value={String(stats.ocrDone)}
          hint={`${stats.ocrPending} en attente / échec`}
        />
        <StatCard
          label="Factures"
          value={String(
            stats.byCategory.find((c) => c.category === DocumentCategory.FACTURE)
              ?.count ?? 0,
          )}
          hint="Classées automatiquement"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DocumentUploadZone
            action={uploadDocumentFromHubAction}
            clients={clients}
          />
          {clients.length === 0 && (
            <p className="mt-3 text-sm text-amber-800">
              Créez d&apos;abord un{" "}
              <Link href="/clients/new" className="font-medium underline">
                client
              </Link>{" "}
              pour déposer des documents.
            </p>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
          <h2 className="text-sm font-semibold text-violet-950">
            Fonctionnalités « révolutionnaires »
          </h2>
          <ul className="space-y-2 text-sm text-violet-900/90">
            <li className="flex gap-2">
              <span className="font-bold text-violet-700">①</span>
              <span>
                <strong>Dépôt glisser-déposer</strong> multi-fichiers (jusqu&apos;à
                10) par dossier client.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-violet-700">②</span>
              <span>
                <strong>Classement IA</strong> : facture, justificatif fiscal,
                contrat — selon le nom et le type de fichier.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-violet-700">③</span>
              <span>
                <strong>OCR facture</strong> : extraction montant TTC, date,
                émetteur, SIRET et n° de facture (PDF + images).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-violet-700">④</span>
              <span>
                <strong>Coffre par client</strong> : chaque pièce est rattachée au
                dossier et consultable depuis la fiche client.
              </span>
            </li>
          </ul>
          <a
            href="/api/export/documents"
            className="inline-block text-sm font-medium text-violet-800 hover:underline"
          >
            Exporter l&apos;inventaire CSV →
          </a>
        </div>
      </div>

      <section className="space-y-4">
        <form method="get" className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher document, client, fournisseur…"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
          {categoryFilter && (
            <input type="hidden" name="category" value={categoryFilter} />
          )}
          {ocrFilter && <input type="hidden" name="ocr" value={ocrFilter} />}
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <FilterChip href="/documents" active={!categoryFilter && !ocrFilter} label="Tous" />
          <FilterChip
            href="/documents?ocr=pending"
            active={ocrFilter === "pending"}
            label="OCR en cours"
          />
          <FilterChip
            href="/documents?ocr=done"
            active={ocrFilter === "done"}
            label="OCR terminé"
          />
          {Object.values(DocumentCategory).map((cat) => (
            <FilterChip
              key={cat}
              href={`/documents?category=${cat}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              active={categoryFilter === cat}
              label={documentCategoryLabel(cat)}
            />
          ))}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="hidden px-4 py-3 sm:table-cell">Client</th>
              <th className="px-4 py-3">Catégorie / OCR</th>
              <th className="hidden px-4 py-3 sm:table-cell">Montant</th>
              <th className="hidden px-4 py-3 md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-medium text-theme-link hover:underline"
                  >
                    {doc.label ?? doc.fileName}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(doc.sizeBytes)}
                    {doc.uploadedBy ? ` · ${doc.uploadedBy.name}` : ""}
                  </p>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Link
                    href={`/clients/${doc.client.id}`}
                    className="text-slate-700 hover:underline"
                  >
                    {doc.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[doc.category]}`}
                    >
                      {documentCategoryLabel(doc.category)}
                    </span>
                    <DocumentOcrBadge doc={doc} />
                  </div>
                </td>
                <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                  {doc.extractedAmount != null
                    ? formatEuro(doc.extractedAmount)
                    : "—"}
                </td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                  {formatDateFr(doc.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Aucun document. Utilisez le coffre-fort ci-dessus ou une fiche client.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        active
          ? "ui-btn ui-btn-primary"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}
