import Link from "next/link";
import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { syncOverdueNotifications } from "@/lib/notifications";
import { getAssignmentSuggestions } from "@/lib/scoring";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { FlashBanner } from "@/components/flash-banner";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, StatCard } from "@/components/ui/stat-card";
import { runMonthlyTvaAction } from "@/actions/obligations";
import { formatDateFr } from "@/lib/dates";

type Props = {
  searchParams: Promise<{ monthlyTva?: string }>;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getSessionUser();
  const sp = await searchParams;
  const today = startOfToday();
  const canRunMonthly =
    user?.role === Role.DIRECTOR || user?.role === Role.MANAGER;
  const monthlyCreated = Number.parseInt(sp.monthlyTva ?? "", 10);

  await syncOverdueNotifications();

  const showSuggestions =
    user?.role === Role.DIRECTOR || user?.role === Role.MANAGER;

  const [
    clientCount,
    tasksByStatus,
    overdueCount,
    urgentOpen,
    recentTasks,
    collaborators,
    recentAlerts,
    suggestions,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.task.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.task.count({
      where: {
        status: { not: TaskStatus.DONE },
        dueDate: { lt: today },
      },
    }),
    prisma.task.count({
      where: {
        status: { not: TaskStatus.DONE },
        priority: "URGENT",
      },
    }),
    prisma.task.findMany({
      take: 8,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      include: {
        client: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { reliabilityScore: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        reliabilityScore: true,
        maxConcurrentTasks: true,
        _count: { select: { tasks: { where: { status: { not: TaskStatus.DONE } } } } },
      },
    }),
    user
      ? prisma.notification.findMany({
          where: { userId: user.id, readAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    showSuggestions ? getAssignmentSuggestions() : Promise.resolve([]),
  ]);

  const statusMap = Object.fromEntries(
    tasksByStatus.map((r) => [r.status, r._count]),
  ) as Partial<Record<TaskStatus, number>>;

  const cards = [
    { label: "Clients suivis", value: clientCount, hint: "Portefeuille actif" },
    {
      label: "Tâches en retard",
      value: overdueCount,
      hint: "Échéance dépassée, hors terminé",
      danger: overdueCount > 0,
    },
    {
      label: "Urgences ouvertes",
      value: urgentOpen,
      hint: "Priorité urgente non bouclée",
      danger: urgentOpen > 0,
    },
    {
      label: "En validation",
      value: statusMap.IN_VALIDATION ?? 0,
      hint: "Contrôle anti-erreur",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        title="Vue d'ensemble"
        description="Vision 360° du cabinet : clients, charge, retards et validation des dossiers en quelques secondes."
      />

      {!Number.isNaN(monthlyCreated) && sp.monthlyTva !== undefined && (
        <FlashBanner
          message={
            monthlyCreated > 0
              ? `${monthlyCreated} tâche(s) TVA mensuelle créée(s) pour le portefeuille.`
              : "TVA mensuelle déjà générée ce mois-ci pour tous les clients."
          }
          variant={monthlyCreated > 0 ? "success" : "info"}
        />
      )}

      {canRunMonthly && (
        <section className="animate-fade-in-up ui-card flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <p className="text-sm text-emerald-900">
            <span className="font-semibold">Automatisation mensuelle</span> —
            lance la TVA du mois pour chaque client (sans doublon).
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={runMonthlyTvaAction}>
              <button type="submit" className="ui-btn ui-btn-primary">
                Générer TVA du mois
              </button>
            </form>
            <ButtonLink href="/rapport" variant="secondary">
              Rapport hebdo
            </ButtonLink>
            <a href="/api/export/tasks-overdue" className="ui-btn ui-btn-secondary">
              Export CSV retards
            </a>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            hint={c.hint}
            danger={c.danger}
            delay={(i + 1) * 80}
          />
        ))}
      </section>

      {suggestions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Suggestions intelligentes
          </h2>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  s.severity === "warning"
                    ? "border-rose-200 bg-rose-50/80 text-rose-950"
                    : "border-sky-200 bg-sky-50/80 text-sky-950"
                }`}
              >
                <p className="font-medium">{s.title}</p>
                <p className="mt-0.5 opacity-90">{s.detail}</p>
                {s.href && (
                  <Link
                    href={s.href}
                    className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Agir →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentAlerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Alertes</h2>
            <Link
              href="/notifications"
              className="text-sm font-medium text-theme-link hover:underline"
            >
              Toutes les notifications
            </Link>
          </div>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
            {recentAlerts.map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-amber-950">{a.title}</p>
                {a.body && (
                  <p className="mt-0.5 text-amber-900/80">{a.body}</p>
                )}
                {a.taskId && (
                  <Link
                    href={`/tasks/${a.taskId}`}
                    className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Ouvrir la tâche
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Tâches à suivre
            </h2>
            <Link
              href="/tasks"
              className="text-sm font-medium text-theme-link hover:text-emerald-700"
            >
              Voir tout
            </Link>
          </div>
          <Panel className="overflow-hidden">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tâche</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Assigné</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTasks.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-emerald-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${t.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {t.title}
                      </Link>
                      <div className="mt-1 flex gap-2">
                        <PriorityBadge priority={t.priority} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.client.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.assignee?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateFr(t.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentTasks.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                <p>Aucune tâche pour le moment.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/clients/new"
                    className="rounded-lg ui-btn ui-btn-primary"
                  >
                    Nouveau client
                  </Link>
                  <Link
                    href="/tasks/new"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Nouvelle tâche
                  </Link>
                  <Link
                    href="/tasks?filter=overdue"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Voir les retards
                  </Link>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Charge & fiabilité
          </h2>
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white p-4">
            {collaborators.map((u, i) => (
              <div
                key={u.id}
                className="ui-card ui-card-hover animate-fade-in-up px-4 py-3"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">
                      {u._count.tasks} tâche(s) ouverte(s) / max{" "}
                      {u.maxConcurrentTasks}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    {Math.round(u.reliabilityScore)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Le score évolue à chaque clôture de tâche et guide l&apos;assignation
            automatique avec la charge et le plafond par personne.
          </p>
        </div>
      </section>
    </div>
  );
}
