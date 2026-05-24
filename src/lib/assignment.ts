import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Choisit un collaborateur selon charge actuelle, plafond et score de fiabilité.
 */
export async function suggestAssigneeId(): Promise<string | null> {
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.COLLABORATOR, Role.MANAGER] } },
    select: {
      id: true,
      reliabilityScore: true,
      maxConcurrentTasks: true,
      _count: {
        select: {
          tasks: { where: { status: { not: TaskStatus.DONE } } },
        },
      },
    },
  });

  const candidates = users.filter(
    (u) => u._count.tasks < u.maxConcurrentTasks,
  );
  const pool = candidates.length ? candidates : users;
  if (!pool.length) return null;

  pool.sort((a, b) => {
    const loadA = a._count.tasks / Math.max(a.maxConcurrentTasks, 1);
    const loadB = b._count.tasks / Math.max(b.maxConcurrentTasks, 1);
    if (loadA !== loadB) return loadA - loadB;
    return b.reliabilityScore - a.reliabilityScore;
  });

  return pool[0].id;
}
