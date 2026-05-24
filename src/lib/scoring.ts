import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MIN_SCORE = 40;
const MAX_SCORE = 100;
const ON_TIME_BONUS = 2;
const LATE_PENALTY = 5;

function clampScore(value: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, value));
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Ajuste le score de fiabilité quand une tâche passe à « Terminé ».
 * Bonus si clôture à l'échéance ou avant, malus si en retard.
 */
export async function applyCompletionScore(
  assigneeId: string,
  dueDate: Date,
  completedAt: Date = new Date(),
): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { reliabilityScore: true },
  });
  if (!user) return null;

  const onTime = startOfDay(completedAt) <= startOfDay(dueDate);
  const delta = onTime ? ON_TIME_BONUS : -LATE_PENALTY;
  const next = clampScore(user.reliabilityScore + delta);

  await prisma.user.update({
    where: { id: assigneeId },
    data: { reliabilityScore: next },
  });

  return next;
}

export type CollaboratorPerformance = {
  userId: string;
  completedTotal: number;
  completedOnTime: number;
  completedLate: number;
  openOverdue: number;
  onTimeRate: number | null;
};

export async function getCollaboratorPerformance(
  userId: string,
): Promise<CollaboratorPerformance> {
  const today = startOfDay(new Date());

  const [completed, openOverdue] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: userId, status: TaskStatus.DONE },
      select: { dueDate: true, updatedAt: true },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: today },
      },
    }),
  ]);

  let completedOnTime = 0;
  let completedLate = 0;
  for (const t of completed) {
    if (startOfDay(t.updatedAt) <= startOfDay(t.dueDate)) {
      completedOnTime++;
    } else {
      completedLate++;
    }
  }

  const completedTotal = completed.length;
  const onTimeRate =
    completedTotal > 0
      ? Math.round((completedOnTime / completedTotal) * 100)
      : null;

  return {
    userId,
    completedTotal,
    completedOnTime,
    completedLate,
    openOverdue,
    onTimeRate,
  };
}

export type AssignmentSuggestion = {
  id: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

/**
 * Suggestions rule-based (Phase 3) pour le directeur / manager.
 */
export async function getAssignmentSuggestions(): Promise<
  AssignmentSuggestion[]
> {
  const today = startOfDay(new Date());
  const suggestions: AssignmentSuggestion[] = [];

  const [overdueUnassigned, overloaded, lowReliability] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: null,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: today },
      },
      take: 3,
      include: { client: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: [Role.COLLABORATOR, Role.MANAGER] } },
      select: {
        id: true,
        name: true,
        maxConcurrentTasks: true,
        _count: {
          select: {
            tasks: { where: { status: { not: TaskStatus.DONE } } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: Role.COLLABORATOR,
        reliabilityScore: { lt: 75 },
      },
      orderBy: { reliabilityScore: "asc" },
      take: 2,
      select: { id: true, name: true, reliabilityScore: true },
    }),
  ]);

  for (const t of overdueUnassigned) {
    suggestions.push({
      id: `overdue-unassigned-${t.id}`,
      severity: "warning",
      title: "Tâche en retard non assignée",
      detail: `${t.title} (${t.client.name}) — lancer une assignation intelligente.`,
      href: `/tasks/${t.id}`,
    });
  }

  for (const u of overloaded) {
    if (u._count.tasks >= u.maxConcurrentTasks) {
      suggestions.push({
        id: `overload-${u.id}`,
        severity: "warning",
        title: `${u.name} au plafond de charge`,
        detail: `${u._count.tasks}/${u.maxConcurrentTasks} tâches ouvertes — répartir ou reporter.`,
        href: "/equipe",
      });
    }
  }

  for (const u of lowReliability) {
    suggestions.push({
      id: `reliability-${u.id}`,
      severity: "info",
      title: `Fiabilité à surveiller — ${u.name}`,
      detail: `Score ${Math.round(u.reliabilityScore)}/100 — privilégier les dossiers simples ou accompagner.`,
      href: "/equipe",
    });
  }

  return suggestions.slice(0, 5);
}
