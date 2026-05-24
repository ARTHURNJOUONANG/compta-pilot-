import { NotificationType, Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
  clientId?: string;
};

const EMAIL_ENABLED_TYPES = new Set<NotificationType>([
  NotificationType.TASK_ASSIGNED,
  NotificationType.TASK_OVERDUE,
  NotificationType.VALIDATION_REQUESTED,
  NotificationType.TASK_COMPLETED,
  NotificationType.OCR_COMPLETED,
]);

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      taskId: input.taskId ?? null,
    },
  });

  if (!EMAIL_ENABLED_TYPES.has(input.type)) return;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, name: true },
  });
  if (!user) return;

  await sendNotificationEmail({
    to: user.email,
    recipientName: user.name,
    type: input.type,
    title: input.title,
    body: input.body,
    taskId: input.taskId,
    clientId: input.clientId,
  });
}

export async function notifyTaskAssigned(params: {
  assigneeId: string;
  taskId: string;
  taskTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: "Nouvelle tâche assignée",
    body: params.taskTitle,
    taskId: params.taskId,
  });
}

export async function notifyTaskCompleted(params: {
  taskId: string;
  taskTitle: string;
  clientName: string;
  clientId: string;
}): Promise<void> {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: [Role.DIRECTOR, Role.MANAGER] } },
    select: { id: true },
  });

  const body = `${params.taskTitle} — ${params.clientName}`;
  await Promise.all(
    reviewers.map((u) =>
      createNotification({
        userId: u.id,
        type: NotificationType.TASK_COMPLETED,
        title: "Tâche terminée",
        body,
        taskId: params.taskId,
        clientId: params.clientId,
      }),
    ),
  );
}

export async function notifyValidationRequested(params: {
  taskId: string;
  taskTitle: string;
  clientName: string;
  clientId: string;
}): Promise<void> {
  const reviewers = await prisma.user.findMany({
    where: { role: { in: [Role.DIRECTOR, Role.MANAGER] } },
    select: { id: true },
  });

  const body = `${params.taskTitle} — ${params.clientName}`;
  await Promise.all(
    reviewers.map((u) =>
      createNotification({
        userId: u.id,
        type: NotificationType.VALIDATION_REQUESTED,
        title: "Validation demandée",
        body,
        taskId: params.taskId,
        clientId: params.clientId,
      }),
    ),
  );
}

export async function notifyOcrCompleted(params: {
  documentId: string;
  clientId: string;
  fileName: string;
  uploadedById: string | null;
  summary: string;
}): Promise<void> {
  const recipientIds = new Set<string>();
  if (params.uploadedById) recipientIds.add(params.uploadedById);

  const managers = await prisma.user.findMany({
    where: { role: { in: [Role.DIRECTOR, Role.MANAGER] } },
    select: { id: true },
  });
  for (const m of managers) recipientIds.add(m.id);

  const body = `${params.fileName} — ${params.summary}`;

  await Promise.all(
    [...recipientIds].map((userId) =>
      createNotification({
        userId,
        type: NotificationType.OCR_COMPLETED,
        title: "Analyse OCR terminée",
        body,
        clientId: params.clientId,
      }),
    ),
  );
}

export async function syncOverdueNotifications(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = await prisma.task.findMany({
    where: {
      status: { not: TaskStatus.DONE },
      dueDate: { lt: today },
    },
    include: {
      client: { select: { name: true, id: true } },
      assignee: { select: { id: true } },
    },
  });

  const directors = await prisma.user.findMany({
    where: { role: Role.DIRECTOR },
    select: { id: true },
  });

  for (const task of overdue) {
    const body = `${task.title} — ${task.client.name}`;
    const recipients = new Set<string>();
    if (task.assigneeId) recipients.add(task.assigneeId);
    for (const d of directors) recipients.add(d.id);

    for (const userId of recipients) {
      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          taskId: task.id,
          type: NotificationType.TASK_OVERDUE,
          readAt: null,
        },
      });
      if (exists) continue;

      await createNotification({
        userId,
        type: NotificationType.TASK_OVERDUE,
        title: "Tâche en retard",
        body,
        taskId: task.id,
        clientId: task.client.id,
      });
    }
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
