import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";

function typeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return "Assignation";
    case NotificationType.TASK_OVERDUE:
      return "Retard";
    case NotificationType.VALIDATION_REQUESTED:
      return "Validation";
    case NotificationType.TASK_COMPLETED:
      return "Terminé";
    case NotificationType.OCR_COMPLETED:
      return "OCR";
    default:
      return type;
  }
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            {unread > 0
              ? `${unread} non lue${unread > 1 ? "s" : ""}`
              : "Tout est à jour"}
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`px-4 py-4 ${!n.readAt ? "bg-emerald-50/40" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium uppercase text-emerald-700">
                  {typeLabel(n.type)}
                </span>
                <p className="mt-1 font-medium text-slate-900">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {n.createdAt.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2">
                {n.taskId ? (
                  <Link
                    href={`/tasks/${n.taskId}`}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Voir la tâche
                  </Link>
                ) : n.type === NotificationType.OCR_COMPLETED ? (
                  <Link
                    href="/documents"
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Voir les documents
                  </Link>
                ) : null}
                {!n.readAt && (
                  <form action={markNotificationReadAction.bind(null, n.id)}>
                    <button
                      type="submit"
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Marquer lu
                    </button>
                  </form>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {notifications.length === 0 && (
        <p className="text-sm text-slate-500">Aucune notification pour le moment.</p>
      )}
    </div>
  );
}
