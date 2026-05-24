import Link from "next/link";
import { DocumentCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { documentCategoryLabel } from "@/lib/labels";
import { formatDateFr } from "@/lib/dates";
import { formatFileSize } from "@/lib/documents";
import { formatEuro } from "@/lib/ocr";
import { DocumentOcrBadge } from "@/components/document-ocr-badge";

const categoryStyles: Record<DocumentCategory, string> = {
  FACTURE: "bg-violet-100 text-violet-900",
  JUSTIFICATIF: "bg-sky-100 text-sky-900",
  CONTRAT: "bg-amber-100 text-amber-900",
  AUTRE: "bg-slate-100 text-slate-800",
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function DocumentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryFilter =
    sp.category && Object.values(DocumentCategory).includes(sp.category as DocumentCategory)
      ? (sp.category as DocumentCategory)
      : undefined;

  const documents = await prisma.document.findMany({
    where: categoryFilter ? { category: categoryFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      uploadedBy: { select: { name: true } },
    },
  });

  const counts = await prisma.document.groupBy({
    by: ["category"],
    _count: true,
  });
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Toutes les pièces déposées — OCR automatique sur PDF et images (montant,
          date, n° facture).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          href="/documents"
          active={!categoryFilter}
          label={`Tous (${total})`}
        />
        {Object.values(DocumentCategory).map((cat) => {
          const count = counts.find((c) => c.category === cat)?._count ?? 0;
          return (
            <FilterChip
              key={cat}
              href={`/documents?category=${cat}`}
              active={categoryFilter === cat}
              label={`${documentCategoryLabel(cat)} (${count})`}
            />
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="hidden px-4 py-3 sm:table-cell">Client</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="hidden px-4 py-3 sm:table-cell">Montant OCR</th>
              <th className="hidden px-4 py-3 md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <a
                    href={`/api/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-800 hover:underline"
                  >
                    {doc.label ?? doc.fileName}
                  </a>
                  <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                    <Link
                      href={`/clients/${doc.client.id}`}
                      className="hover:underline"
                    >
                      {doc.client.name}
                    </Link>
                    {" · "}
                    {formatFileSize(doc.sizeBytes)}
                  </p>
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                    {doc.fileName} · {formatFileSize(doc.sizeBytes)}
                    {doc.uploadedBy ? ` · ${doc.uploadedBy.name}` : ""}
                  </p>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Link
                    href={`/clients/${doc.client.id}`}
                    className="text-slate-700 hover:text-emerald-800 hover:underline"
                  >
                    {doc.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyles[doc.category]}`}
                    >
                      {documentCategoryLabel(doc.category)}
                    </span>
                    <DocumentOcrBadge doc={doc} />
                  </div>
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-slate-900 sm:table-cell">
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
            Aucun document
            {categoryFilter
              ? ` dans la catégorie « ${documentCategoryLabel(categoryFilter)} »`
              : ""}
            . Déposez des fichiers depuis une fiche client.
          </p>
        )}
      </div>
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
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}
