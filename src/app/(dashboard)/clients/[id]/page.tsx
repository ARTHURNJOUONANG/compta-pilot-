import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  deleteClientAction,
  regenerateObligationsAction,
  updateClientAction,
} from "@/actions/clients";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { FlashBanner } from "@/components/flash-banner";
import { formatDateFr } from "@/lib/dates";
import { ClientDocuments } from "@/components/client-documents";
import {
  contractStatusClass,
  contractStatusLabel,
} from "@/lib/contracts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tasksCreated?: string;
    saved?: string;
    docUploaded?: string;
    docDeleted?: string;
    docError?: string;
    docWarn?: string;
    ocrStarted?: string;
    ocrDone?: string;
  }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: [{ dueDate: "asc" }],
        include: { assignee: { select: { name: true } } },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
      contracts: {
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
    },
  });
  if (!client) notFound();

  const tasksCreated = Number.parseInt(sp.tasksCreated ?? "", 10);
  const canDelete =
    user?.role === Role.DIRECTOR || user?.role === Role.MANAGER;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {sp.saved === "1" && (
        <FlashBanner message="Fiche client mise à jour." />
      )}
      {tasksCreated > 0 && (
        <FlashBanner
          message={`${tasksCreated} obligation(s) créée(s) et assignée(s) automatiquement.`}
        />
      )}
      {sp.tasksCreated === "0" && (
        <FlashBanner
          message="Aucune nouvelle obligation : les modèles existent déjà pour ce client."
          variant="info"
        />
      )}
      {sp.docUploaded && Number(sp.docUploaded) > 0 && (
        <FlashBanner
          message={`${sp.docUploaded} document(s) archivé(s).${Number(sp.ocrStarted ?? 0) > 0 ? ` OCR lancé sur ${sp.ocrStarted} fichier(s).` : ""}`}
          variant={Number(sp.ocrStarted ?? 0) > 0 ? "info" : "success"}
        />
      )}
      {sp.docWarn && (
        <FlashBanner message={decodeURIComponent(sp.docWarn)} variant="info" />
      )}
      {sp.ocrDone === "1" && (
        <FlashBanner message="Analyse OCR terminée." />
      )}
      {sp.docDeleted === "1" && (
        <FlashBanner message="Document supprimé." />
      )}
      {sp.docError && (
        <FlashBanner message={decodeURIComponent(sp.docError)} variant="info" />
      )}

      <div>
        <Link
          href="/clients"
          className="text-sm font-medium text-theme-link hover:underline"
        >
          ← Clients
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {client.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {client.siret && `SIRET ${client.siret}`}
          {client.email && ` · ${client.email}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={regenerateObligationsAction.bind(null, client.id)}>
          <button
            type="submit"
            className="ui-btn ui-btn-primary px-4 py-2 text-sm"
          >
            Régénérer les obligations
          </button>
        </form>
        {canDelete && (
          <form action={deleteClientAction.bind(null, client.id)}>
            <button
              type="submit"
              className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Supprimer le client
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          action={updateClientAction.bind(null, client.id)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Fiche client</h2>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Raison sociale *
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={client.name}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="siret">
              SIRET
            </label>
            <input
              id="siret"
              name="siret"
              defaultValue={client.siret ?? ""}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="phone">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={client.phone ?? ""}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="notes">
              Notes internes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={client.notes ?? ""}
              className="ui-input mt-1"
            />
          </div>
          <button
            type="submit"
            className="ui-btn ui-btn-dark"
          >
            Mettre à jour
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Tâches liées</h2>
            <Link
              href={`/tasks/new?clientId=${client.id}`}
              className="ui-btn ui-btn-primary px-3 py-1.5 text-sm"
            >
              Nouvelle tâche
            </Link>
          </div>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {client.tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tasks/${t.id}`}
                  className="block px-4 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{t.title}</span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Échéance {formatDateFr(t.dueDate)}
                    {t.assignee ? ` · ${t.assignee.name}` : " · Non assigné"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {client.tasks.length === 0 && (
            <p className="text-sm text-slate-500">Aucune tâche pour ce client.</p>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Contrats</h2>
          <Link
            href={`/contrats/new?clientId=${client.id}`}
            className="ui-btn ui-btn-primary px-3 py-1.5 text-sm"
          >
            Nouveau contrat
          </Link>
        </div>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {client.contracts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/contrats/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{c.title}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${contractStatusClass(c.status)}`}
                >
                  {contractStatusLabel(c.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {client.contracts.length === 0 && (
          <p className="text-sm text-slate-500">
            Aucun contrat pour ce client. Créez une lettre de mission ou une convention.
          </p>
        )}
        {client.contracts.length > 0 && (
          <Link href="/contrats" className="text-sm font-medium text-theme-link hover:underline">
            Voir tous les contrats →
          </Link>
        )}
      </section>

      {user && (
        <ClientDocuments
          clientId={client.id}
          clientName={client.name}
          documents={client.documents}
          canDeleteAny={canDelete}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
