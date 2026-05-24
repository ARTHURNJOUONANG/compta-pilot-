import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { formatDateFr } from "@/lib/dates";

type Search = { searchParams?: Promise<{ status?: string }> };

export default async function TasksPage({ searchParams }: Search) {
  const sp = (await searchParams) ?? {};
  const statusFilter = sp.status as TaskStatus | undefined;
  const where =
    statusFilter && Object.values(TaskStatus).includes(statusFilter)
      ? { status: statusFilter }
      : {};

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
    },
  });

  const filters: { label: string; value?: TaskStatus }[] = [
    { label: "Toutes" },
    { label: "À faire", value: TaskStatus.TODO },
    { label: "En cours", value: TaskStatus.IN_PROGRESS },
    { label: "En validation", value: TaskStatus.IN_VALIDATION },
    { label: "Terminé", value: TaskStatus.DONE },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tâches</h1>
          <p className="mt-1 text-sm text-slate-600">
            Suivi des obligations : TVA, liasse, paie, bilan — avec statuts et
            validation.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Nouvelle tâche
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const href = f.value ? `/tasks?status=${f.value}` : "/tasks";
          const active = (f.value ?? "ALL") === (statusFilter ?? "ALL");
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tâche</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Assigné</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Étape validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/tasks/${t.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {t.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${t.client.id}`}
                    className="text-slate-600 hover:underline"
                  >
                    {t.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {t.assignee?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateFr(t.dueDate)}
                </td>
                <td className="px-4 py-3 text-slate-600">{t.validationStep}/3</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Aucune tâche pour ce filtre.
          </p>
        )}
      </div>
    </div>
  );
}
