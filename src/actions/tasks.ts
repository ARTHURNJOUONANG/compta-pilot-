"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { suggestAssigneeId } from "@/lib/assignment";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyValidationRequested,
} from "@/lib/notifications";
import { applyCompletionScore } from "@/lib/scoring";
function parseDate(value: FormDataEntryValue | null): Date {
  const s = String(value ?? "").trim();
  if (!s) return new Date();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function canSetFinalValidation(role: Role): boolean {
  return role === Role.DIRECTOR || role === Role.MANAGER;
}
export async function createTaskAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const title = String(formData.get("title") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!title || !clientId) throw new Error("Titre et client requis");
  const priority = (String(formData.get("priority") ?? "NORMAL") ||
    "NORMAL") as TaskPriority;
  const status = (String(formData.get("status") ?? "TODO") ||
    "TODO") as TaskStatus;
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const auto = String(formData.get("autoAssign") ?? "") === "on";
  let assigneeId: string | null = assigneeIdRaw || null;
  if (auto) {
    assigneeId = await suggestAssigneeId();
  }
  const task = await prisma.task.create({
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Divers").trim() || "Divers",
      clientId,
      status,
      priority,
      dueDate: parseDate(formData.get("dueDate")),
      assigneeId,
    },
    include: { client: { select: { name: true } } },
  });
  if (assigneeId) {
    await notifyTaskAssigned({
      assigneeId,
      taskId: task.id,
      taskTitle: task.title,
    });
  }
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/notifications");
  redirect("/tasks");
}
export async function updateTaskAction(taskId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titre requis");
  const previous = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: { select: { name: true } } },
  });
  if (!previous) throw new Error("Tâche introuvable");
  const clientId = String(formData.get("clientId") ?? "").trim();
  const priority = String(formData.get("priority") ?? "NORMAL") as TaskPriority;
  const status = String(formData.get("status") ?? "TODO") as TaskStatus;
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const assigneeId = assigneeIdRaw ? assigneeIdRaw : null;
  let validationStep = Math.min(
    3,
    Math.max(1, Number.parseInt(String(formData.get("validationStep") ?? "1"), 10) || 1),
  );
  if (validationStep === 3 && !canSetFinalValidation(user.role)) {
    validationStep = Math.min(previous.validationStep, 2);
  }
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Divers").trim() || "Divers",
      clientId,
      status,
      priority,
      dueDate: parseDate(formData.get("dueDate")),
      assigneeId,
      validationStep,
    },
    include: { client: { select: { name: true } } },
  });
  if (assigneeId && assigneeId !== previous.assigneeId) {
    await notifyTaskAssigned({
      assigneeId,
      taskId: task.id,
      taskTitle: task.title,
    });
  }
  if (
    status === TaskStatus.IN_VALIDATION &&
    previous.status !== TaskStatus.IN_VALIDATION
  ) {
    await notifyValidationRequested({
      taskId: task.id,
      taskTitle: task.title,
      clientName: task.client.name,
      clientId: task.clientId,
    });
  }
  if (
    status === TaskStatus.DONE &&
    previous.status !== TaskStatus.DONE &&
    task.assigneeId
  ) {
    await applyCompletionScore(task.assigneeId, task.dueDate);
    await notifyTaskCompleted({
      taskId: task.id,
      taskTitle: task.title,
      clientName: task.client.name,
      clientId: task.clientId,
    });
  }
  revalidatePath("/tasks");
  revalidatePath("/equipe");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/");
  revalidatePath(`/clients/${task.clientId}`);
  revalidatePath("/notifications");
  redirect(`/tasks/${taskId}?saved=1`);
}
export async function smartAssignTaskAction(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const id = await suggestAssigneeId();
  if (!id) throw new Error("Aucun collaborateur disponible");
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: id },
  });
  await notifyTaskAssigned({
    assigneeId: id,
    taskId: task.id,
    taskTitle: task.title,
  });
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/");
  revalidatePath(`/clients/${task.clientId}`);
  revalidatePath("/notifications");
  redirect(`/tasks/${taskId}?saved=1`);
}
export async function approveTaskAction(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  if (!canSetFinalValidation(user.role)) {
    throw new Error("Validation finale réservée au directeur ou manager");
  }

  const previous = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: { select: { name: true } } },
  });
  if (!previous) throw new Error("Tâche introuvable");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.DONE,
      validationStep: 3,
    },
    include: { client: { select: { name: true } } },
  });

  if (
    previous.status !== TaskStatus.DONE &&
    task.assigneeId
  ) {
    await applyCompletionScore(task.assigneeId, task.dueDate);
    await notifyTaskCompleted({
      taskId: task.id,
      taskTitle: task.title,
      clientName: task.client.name,
      clientId: task.clientId,
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/");
  revalidatePath("/equipe");
  revalidatePath(`/clients/${task.clientId}`);
  revalidatePath("/notifications");
  redirect(`/tasks/${taskId}?validated=1`);
}

export async function requestValidationAction(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const previous = await prisma.task.findUnique({
    where: { id: taskId },
    include: { client: { select: { name: true } } },
  });
  if (!previous) throw new Error("Tâche introuvable");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.IN_VALIDATION,
      validationStep: Math.min(Math.max(previous.validationStep, 2), 2),
    },
    include: { client: { select: { name: true } } },
  });

  if (previous.status !== TaskStatus.IN_VALIDATION) {
    await notifyValidationRequested({
      taskId: task.id,
      taskTitle: task.title,
      clientName: task.client.name,
      clientId: task.clientId,
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/");
  revalidatePath("/notifications");
  redirect(`/tasks/${taskId}?saved=1`);
}

export async function deleteTaskAction(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { clientId: true },
  });
  if (!task) throw new Error("Tâche introuvable");
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath(`/clients/${task.clientId}`);
  redirect("/tasks");
}
