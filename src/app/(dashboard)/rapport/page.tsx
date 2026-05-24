import Link from "next/link";
import { Role, TaskStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { getSessionUser } from "@/lib/auth";
import { formatDateFr } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export default async function RapportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === Role.COLLABORATOR) {
    redirect("/");
  }

  const today = startOfToday();
  const weekStart = startOfWeek();

  const [clientCount, overdue, inValidation, doneThisWeek, byAssignee, clients] =
    await Promise.all([
      prisma.client.count(),
      prisma.task.findMany({
        where: {
          status: { not: TaskStatus.DONE },
          dueDate: { lt: today },
        },
        orderBy: { dueDate: "asc" },
        include: {
          client: { select: { name: true } },
          assignee: { select: { name: true } },
        },
      }),
      prisma.task.count({ where: { status: TaskStatus.IN_VALIDATION } }),
      prisma.task.count({
        where: {
          status: TaskStatus.DONE,
          updatedAt: { gte: weekStart },
        },
      }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: {
          name: true,
          role: true,
          reliabilityScore: true,
          _count: {
            select: {
              tasks: { where: { status: { not: TaskStatus.DONE } } },
            },
          },
        },
      }),
      prisma.client.findMany({
        orderBy: { name: "asc" },
        select: {
          name: true,
          _count: { select: { tasks: true } },
        },
      }),
    ]);

  const generatedAt = new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-8 print:max-w-none">
      <header className="flex flex-wrap items-start justify-between gap-4 print:block">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Rapport hebdomadaire
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Synthèse cabinet — généré le {formatDateFr(generatedAt)} à{" "}
            {generatedAt.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" />
          <a
            href="/api/export/tasks-overdue"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Export CSV retards
          </a>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Tableau de bord
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clients actifs", value: clientCount },
          { label: "Tâches en retard", value: overdue.length, danger: true },
          { label: "En validation", value: inValidation },
          { label: "Clôturées cette semaine", value: doneThisWeek },
        ].map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-4 ${
              c.danger
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-xs font-medium uppercase text-slate-500">
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Tâches en retard ({overdue.length})
        </h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun retard à signaler.</p>
        ) : (
          <table className="min-w-full text-left text-sm print:text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Tâche</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Assigné</th>
                <th className="py-2">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdue.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 pr-4 font-medium">{t.title}</td>
                  <td className="py-2 pr-4">{t.client.name}</td>
                  <td className="py-2 pr-4">{t.assignee?.name ?? "—"}</td>
                  <td className="py-2">{formatDateFr(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Charge équipe</h2>
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {byAssignee.map((u) => (
            <li
              key={u.name}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium">{u.name}</span>
                <span className="ml-2 text-slate-500">({u.role})</span>
              </span>
              <span className="text-slate-600">
                {u._count.tasks} tâche(s) ouverte(s) · fiabilité{" "}
                {Math.round(u.reliabilityScore)} %
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Portefeuille clients</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {clients.map((c) => (
            <li
              key={c.name}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              {c.name}{" "}
              <span className="text-slate-500">({c._count.tasks} tâches)</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
