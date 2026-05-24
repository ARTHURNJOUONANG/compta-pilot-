import Link from "next/link";
import { Role, TaskStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { formatDateFr } from "@/lib/dates";

type Search = { searchParams?: Promise<{ status?: string; filter?: string }> };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function TasksPage({ searchParams }: Search) {
  const sp = (await searchParams) ?? {};
  const statusFilter = sp.status as TaskStatus | undefined;
  const filterOverdue = sp.filter === "overdue";
  const today = startOfToday();
  const user = await getSessionUser();
  const canExport =
    user?.role === Role.DIRECTOR || user?.role === Role.MANAGER;

  const where = {
    ...(statusFilter && Object.values(TaskStatus).includes(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(filterOverdue
      ? {
          status: { not: TaskStatus.DONE },
          dueDate: { lt: today },
        }
      : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
    },
  });

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "Toutes", href: "/tasks", active: !statusFilter && !filterOverdue },
    {
      label: "En retard",
      href: "/tasks?filter=overdue",
      active: filterOverdue,
    },
    {
      label: "À faire",
      href: "/tasks?status=TODO",
      active: statusFilter === TaskStatus.TODO,
    },
    {
      label: "En cours",
      href: "/tasks?status=IN_PROGRESS",
      active: statusFilter === TaskStatus.IN_PROGRESS,
    },
    {
      label: "En validation",
      href: "/tasks?status=IN_VALIDATION",
      active: statusFilter === TaskStatus.IN_VALIDATION,
    },
    {
      label: "Terminé",
      href: "/tasks?status=DONE",
      active: statusFilter === TaskStatus.DONE,
    },
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
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <a
              href="/api/export/tasks-overdue"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Export CSV retards
            </a>
          )}
          <Link
            href="/tasks/new"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Nouvelle tâche
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              f.active
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
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
            {tasks.map((t) => {
              const isLate =
                t.status !== TaskStatus.DONE && t.dueDate < today;
              return (
                <tr
                  key={t.id}
                  className={`hover:bg-slate-50/60 ${isLate ? "bg-rose-50/40" : ""}`}
                >
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
                      {isLate && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Retard
                        </span>
                      )}
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
                  <td className="px-4 py-3 text-slate-600">
                    {t.validationStep}/3
                  </td>
                </tr>
              );
            })}
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
