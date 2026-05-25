import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/stat-card";

type Props = { searchParams?: Promise<{ q?: string }> };

export default async function ClientsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { siret: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tasks: true, documents: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Clients"
        description="Dossiers suivis par le cabinet — accès rapide aux tâches liées."
        action={<ButtonLink href="/clients/new">Nouveau client</ButtonLink>}
      />

      <form method="get" className="animate-fade-in-up flex gap-2 stagger-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom, SIRET ou email…"
          className="ui-input flex-1"
        />
        <button type="submit" className="ui-btn ui-btn-secondary">
          Rechercher
        </button>
        {q && (
          <Link href="/clients" className="ui-btn ui-btn-ghost">
            Effacer
          </Link>
        )}
      </form>

      <Panel className="divide-y divide-slate-100">
        {clients.map((c, i) => (
          <div
            key={c.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Link
              href={`/clients/${c.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-all duration-200 hover:bg-emerald-50"
            >
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.siret ? `SIRET ${c.siret}` : "SIRET non renseigné"}
                  {c.email ? ` · ${c.email}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {c._count.tasks} tâche(s)
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                  {c._count.documents} doc.
                </span>
              </div>
            </Link>
          </div>
        ))}
      </Panel>
      {clients.length === 0 && (
        <p className="text-sm text-slate-500">
          {q
            ? `Aucun client pour « ${q} ».`
            : "Aucun client. Commencez par en ajouter un."}
        </p>
      )}
    </div>
  );
}
