import Link from "next/link";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTaskAction } from "@/actions/tasks";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";

type Props = { searchParams?: Promise<{ clientId?: string }> };

export default async function NewTaskPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const [clients, users] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { not: "DIRECTOR" } },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const dueStr = defaultDue.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link
          href="/tasks"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Tâches
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Nouvelle tâche
        </h1>
      </div>

      <form
        action={createTaskAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Intitulé *
          </label>
          <input
            id="title"
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="clientId">
            Client *
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={sp.clientId ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          >
            <option value="">— Choisir —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="category">
            Catégorie
          </label>
          <input
            id="category"
            name="category"
            placeholder="TVA, Paie, Bilan…"
            defaultValue="TVA"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="status">
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={TaskStatus.TODO}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            >
              {Object.values(TaskStatus).map((s) => (
                <option key={s} value={s}>
                  {taskStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="priority"
            >
              Priorité
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={TaskPriority.NORMAL}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            >
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {taskPriorityLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="dueDate">
            Échéance
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={dueStr}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="assigneeId">
            Assigner à
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          >
            <option value="">— Non assigné —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="autoAssign" className="rounded border-slate-300" />
            Délégation intelligente (charge + fiabilité)
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Créer la tâche
        </button>
      </form>
    </div>
  );
}
