import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-600">
            Dossiers suivis par le cabinet — accès rapide aux tâches liées.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Nouveau client
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom, SIRET ou email…"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Rechercher
        </button>
        {q && (
          <Link
            href="/clients"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Effacer
          </Link>
        )}
      </form>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {clients.map((c) => (
          <li key={c.id}>
            <Link
              href={`/clients/${c.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
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
          </li>
        ))}
      </ul>
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
