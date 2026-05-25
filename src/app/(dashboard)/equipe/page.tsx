import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import { getCollaboratorPerformance } from "@/lib/scoring";
import { createUserAction } from "@/actions/users";
import { FlashBanner } from "@/components/flash-banner";

type Props = { searchParams: Promise<{ userCreated?: string }> };

export default async function EquipePage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await getSessionUser();
  const canManageUsers =
    session?.role === Role.DIRECTOR || session?.role === Role.MANAGER;
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      reliabilityScore: true,
      maxConcurrentTasks: true,
      _count: {
        select: {
          tasks: { where: { status: { not: TaskStatus.DONE } } },
        },
      },
    },
  });

  const performances = await Promise.all(
    users
      .filter((u) => u.role !== "DIRECTOR")
      .map((u) => getCollaboratorPerformance(u.id)),
  );
  const perfByUser = Object.fromEntries(
    performances.map((p) => [p.userId, p]),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {sp.userCreated === "1" && (
        <FlashBanner message="Compte créé. Communiquez le mot de passe au collaborateur de façon sécurisée." />
      )}

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Équipe</h1>
        <p className="mt-1 text-sm text-slate-600">
          Comptes réels du cabinet — charge, fiabilité et performance.
        </p>
      </div>

      {canManageUsers && (
        <form
          action={createUserAction}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Ajouter un membre
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Nom *
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Mot de passe initial *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="role">
                Rôle *
              </label>
              <select
                id="role"
                name="role"
                defaultValue={Role.COLLABORATOR}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
              >
                <option value={Role.COLLABORATOR}>Collaborateur</option>
                <option value={Role.MANAGER}>Manager</option>
                {session?.role === Role.DIRECTOR && (
                  <option value={Role.DIRECTOR}>Dirigeant</option>
                )}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl ui-btn ui-btn-primary"
          >
            Créer le compte
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Collaborateur</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Ouvertes</th>
              <th className="px-4 py-3">Terminées</th>
              <th className="px-4 py-3">À temps</th>
              <th className="px-4 py-3">En retard (ouvertes)</th>
              <th className="px-4 py-3">Fiabilité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const perf = perfByUser[u.id];
              const loadRatio =
                u._count.tasks / Math.max(u.maxConcurrentTasks, 1);
              const overloaded = loadRatio >= 1;

              return (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {roleLabel(u.role)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span
                      className={
                        overloaded
                          ? "font-semibold text-rose-700"
                          : "text-slate-900"
                      }
                    >
                      {u._count.tasks}
                    </span>
                    <span className="text-slate-500">
                      {" "}
                      / {u.maxConcurrentTasks}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-900">
                    {perf?.completedTotal ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {perf?.onTimeRate != null ? (
                      <span
                        className={
                          perf.onTimeRate >= 80
                            ? "font-medium text-emerald-700"
                            : perf.onTimeRate >= 60
                              ? "text-amber-800"
                              : "font-medium text-rose-700"
                        }
                      >
                        {perf.onTimeRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {(perf?.openOverdue ?? 0) > 0 ? (
                      <span className="font-medium text-rose-700">
                        {perf!.openOverdue}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.reliabilityScore >= 85
                          ? "bg-emerald-100 text-emerald-700"
                          : u.reliabilityScore >= 70
                            ? "bg-amber-100 text-amber-900"
                            : "bg-rose-100 text-rose-900"
                      }`}
                    >
                      {Math.round(u.reliabilityScore)} / 100
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Le taux « à temps » compare la date de clôture à l&apos;échéance pour
        les tâches terminées. Le score de fiabilité influence la délégation
        automatique.
      </p>
    </div>
  );
}
