import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  approveTaskAction,
  deleteTaskAction,
  requestValidationAction,
  smartAssignTaskAction,
  updateTaskAction,
} from "@/actions/tasks";
import { formatDateFr } from "@/lib/dates";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { FlashBanner } from "@/components/flash-banner";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/labels";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; validated?: string }>;
};

const stepLabels = [
  "1 — Exécution",
  "2 — Vérification interne",
  "3 — Validation finale (dirigeant)",
];

export default async function TaskDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const sessionUser = await getSessionUser();

  const [task, clients, users] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: [Role.COLLABORATOR, Role.MANAGER] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);
  if (!task) notFound();

  const canValidate =
    sessionUser?.role === Role.DIRECTOR || sessionUser?.role === Role.MANAGER;
  const maxValidationStep = canValidate ? 3 : 2;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {sp.saved === "1" && (
        <FlashBanner message="Tâche enregistrée avec succès." />
      )}
      {sp.validated === "1" && (
        <FlashBanner message="Tâche validée et clôturée." />
      )}
      <div>
        <Link
          href="/tasks"
          className="text-sm font-medium text-theme-link hover:underline"
        >
          ← Tâches
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Client{" "}
          <Link
            href={`/clients/${task.client.id}`}
            className="font-medium text-theme-link hover:underline"
          >
            {task.client.name}
          </Link>
          {" · "}
          Échéance {formatDateFr(task.dueDate)}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {task.status !== TaskStatus.IN_VALIDATION &&
          task.status !== TaskStatus.DONE && (
            <form action={requestValidationAction.bind(null, task.id)}>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Envoyer en validation
              </button>
            </form>
          )}
        {canValidate &&
          task.status === TaskStatus.IN_VALIDATION && (
            <form action={approveTaskAction.bind(null, task.id)}>
              <button
                type="submit"
                className="ui-btn ui-btn-primary px-4 py-2.5 text-sm"
              >
                Valider et clôturer
              </button>
            </form>
          )}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <p className="font-semibold">Workflow anti-erreur</p>
        <p className="mt-1 text-amber-900/90">
          Étape actuelle : {stepLabels[task.validationStep - 1] ?? task.validationStep}
        </p>
        <p className="mt-2 text-xs text-amber-900/80">
          Chaque dossier transite par exécution, contrôle interne puis validation
          finale — réduit les erreurs et clarifie les responsabilités.
        </p>
      </div>

      <form
        action={updateTaskAction.bind(null, task.id)}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Modifier la tâche</h2>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Intitulé *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={task.title}
            className="ui-input mt-1"
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
            defaultValue={task.clientId}
            className="ui-input mt-1"
          >
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
            defaultValue={task.category}
            className="ui-input mt-1"
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
            defaultValue={task.description ?? ""}
            className="ui-input mt-1"
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
              defaultValue={task.status}
              className="ui-input mt-1"
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
              defaultValue={task.priority}
              className="ui-input mt-1"
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
            defaultValue={task.dueDate.toISOString().slice(0, 10)}
            className="ui-input mt-1"
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="validationStep"
          >
            Étape de validation (1 à 3)
          </label>
          <input
            id="validationStep"
            name="validationStep"
            type="number"
            min={1}
            max={maxValidationStep}
            defaultValue={Math.min(task.validationStep, maxValidationStep)}
            className="ui-input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="assigneeId">
            Assigné à
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue={task.assigneeId ?? ""}
            className="ui-input mt-1"
          >
            <option value="">— Non assigné —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="ui-btn ui-btn-dark w-full py-2.5"
        >
          Enregistrer
        </button>
      </form>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <form action={smartAssignTaskAction.bind(null, task.id)}>
          <button
            type="submit"
            className="ui-btn ui-btn-primary px-4 py-2 text-sm"
          >
            Réassigner intelligemment
          </button>
        </form>
        <p className="text-xs text-slate-600">
          Utilise la charge ouverte, le plafond par personne et le score de
          fiabilité pour choisir un collaborateur.
        </p>
        <form action={deleteTaskAction.bind(null, task.id)}>
          <button
            type="submit"
            className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Supprimer la tâche
          </button>
        </form>
      </div>
    </div>
  );
}
