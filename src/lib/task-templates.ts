import { TaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { suggestAssigneeId } from "@/lib/assignment";
import { notifyTaskAssigned } from "@/lib/notifications";

export type ObligationTemplate = {
  title: string;
  category: string;
  priority: TaskPriority;
  description?: string;
  dueDate: () => Date;
};

export const OBLIGATION_TEMPLATES: ObligationTemplate[] = [
  {
    title: "TVA mensuelle",
    category: "Fiscal",
    priority: TaskPriority.IMPORTANT,
    description: "Déclaration et paiement de la TVA du mois en cours.",
    dueDate: () => endOfCurrentMonth(),
  },
  {
    title: "Déclaration URSSAF",
    category: "Social",
    priority: TaskPriority.NORMAL,
    description: "DSN et cotisations sociales.",
    dueDate: () => addDays(new Date(), 15),
  },
  {
    title: "Bilan annuel",
    category: "Comptable",
    priority: TaskPriority.URGENT,
    description: "Clôture des comptes et bilan annuel.",
    dueDate: () => fiscalDeadline(3, 31),
  },
  {
    title: "Liasse fiscale",
    category: "Fiscal",
    priority: TaskPriority.IMPORTANT,
    description: "Liasse fiscale et déclarations associées.",
    dueDate: () => fiscalDeadline(4, 30),
  },
];

function endOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function fiscalDeadline(month: number, day: number): Date {
  const year = new Date().getFullYear() + 1;
  return new Date(year, month - 1, day, 23, 59, 59);
}

export async function generateClientObligations(
  clientId: string,
  options?: { autoAssign?: boolean },
): Promise<number> {
  const autoAssign = options?.autoAssign ?? true;

  const existing = await prisma.task.findMany({
    where: { clientId },
    select: { title: true, category: true },
  });
  const existingKeys = new Set(
    existing.map((t) => `${t.title}::${t.category}`),
  );

  const toCreate = OBLIGATION_TEMPLATES.filter(
    (t) => !existingKeys.has(`${t.title}::${t.category}`),
  );
  if (!toCreate.length) return 0;

  let created = 0;
  for (const template of toCreate) {
    let assigneeId: string | null = null;
    if (autoAssign) {
      assigneeId = await suggestAssigneeId();
    }

    const task = await prisma.task.create({
      data: {
        title: template.title,
        description: template.description ?? null,
        category: template.category,
        priority: template.priority,
        dueDate: template.dueDate(),
        clientId,
        assigneeId,
      },
    });
    created++;

    if (assigneeId) {
      await notifyTaskAssigned({
        assigneeId,
        taskId: task.id,
        taskTitle: task.title,
      });
    }
  }

  return created;
}

const TVA_TEMPLATE = OBLIGATION_TEMPLATES[0];

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Génère la TVA mensuelle pour tous les clients qui ne l'ont pas encore ce mois-ci.
 */
export async function generateMonthlyTvaForAllClients(): Promise<number> {
  const monthStart = startOfCurrentMonth();
  const clients = await prisma.client.findMany({ select: { id: true } });
  let created = 0;

  for (const client of clients) {
    const exists = await prisma.task.findFirst({
      where: {
        clientId: client.id,
        title: TVA_TEMPLATE.title,
        category: TVA_TEMPLATE.category,
        createdAt: { gte: monthStart },
      },
    });
    if (exists) continue;

    const assigneeId = await suggestAssigneeId();
    const task = await prisma.task.create({
      data: {
        title: TVA_TEMPLATE.title,
        description: TVA_TEMPLATE.description ?? null,
        category: TVA_TEMPLATE.category,
        priority: TVA_TEMPLATE.priority,
        dueDate: TVA_TEMPLATE.dueDate(),
        clientId: client.id,
        assigneeId,
      },
    });
    created++;

    if (assigneeId) {
      await notifyTaskAssigned({
        assigneeId,
        taskId: task.id,
        taskTitle: task.title,
      });
    }
  }

  return created;
}
