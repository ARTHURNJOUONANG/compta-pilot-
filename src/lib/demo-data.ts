import {
  NotificationType,
  PrismaClient,
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateClientObligations } from "@/lib/task-templates";

const DEMO_PASSWORD = "demo123";

export type LoadDemoResult = {
  created: boolean;
  message: string;
  accounts?: { email: string; role: string }[];
};

export async function loadDemoPortfolio(
  prisma: PrismaClient,
  directorId: string,
): Promise<LoadDemoResult> {
  const existing = await prisma.client.findFirst({
    where: { name: "Atelier Lumière SARL" },
  });
  if (existing) {
    return {
      created: false,
      message: "Le portefeuille de démo est déjà chargé.",
    };
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const upsertUser = async (
    email: string,
    name: string,
    role: Role,
    reliabilityScore: number,
    maxConcurrentTasks: number,
  ) => {
    const found = await prisma.user.findUnique({ where: { email } });
    if (found) return found;
    return prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash: hash,
        reliabilityScore,
        maxConcurrentTasks,
      },
    });
  };

  const director = await prisma.user.findUniqueOrThrow({
    where: { id: directorId },
  });

  const manager = await upsertUser(
    "manager@cabinet.fr",
    "Jean Martin",
    Role.MANAGER,
    92,
    15,
  );
  const c1 = await upsertUser(
    "sophie@cabinet.fr",
    "Sophie Bernard",
    Role.COLLABORATOR,
    88,
    8,
  );
  const c2 = await upsertUser(
    "lucas@cabinet.fr",
    "Lucas Petit",
    Role.COLLABORATOR,
    72,
    8,
  );

  const clientA = await prisma.client.create({
    data: {
      name: "Atelier Lumière SARL",
      siret: "12345678901234",
      email: "contact@atelier-lumiere.fr",
      phone: "01 23 45 67 89",
      notes: "TVA mensuelle, bilan en septembre.",
    },
  });

  const clientB = await prisma.client.create({
    data: {
      name: "TechNova SAS",
      siret: "98765432109876",
      email: "finance@technova.io",
    },
  });

  const newClient = await prisma.client.create({
    data: {
      name: "Boulangerie du Centre",
      siret: "11122233344455",
      email: "compta@boulangerie-centre.fr",
      notes: "Client fraîchement onboardé — obligations auto-générées.",
    },
  });

  await generateClientObligations(newClient.id, { autoAssign: true });

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 3);
  const late = new Date(now);
  late.setDate(late.getDate() - 2);

  const validationTask = await prisma.task.create({
    data: {
      title: "Liasse fiscale — liasse IS",
      category: "Fiscal",
      status: TaskStatus.IN_VALIDATION,
      priority: TaskPriority.URGENT,
      dueDate: soon,
      validationStep: 2,
      clientId: clientB.id,
      assigneeId: c2.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Déclaration TVA — mars",
        description: "CA3 + pièces justificatives.",
        category: "TVA",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: late,
        validationStep: 1,
        clientId: clientA.id,
        assigneeId: c1.id,
      },
      {
        title: "Révision paie Q1",
        category: "Paie",
        status: TaskStatus.TODO,
        priority: TaskPriority.IMPORTANT,
        dueDate: soon,
        validationStep: 1,
        clientId: clientA.id,
        assigneeId: null,
      },
      {
        title: "Bilan annuel — clôture",
        category: "Bilan",
        status: TaskStatus.TODO,
        priority: TaskPriority.NORMAL,
        dueDate: new Date(now.getFullYear(), 8, 30),
        validationStep: 1,
        clientId: clientB.id,
        assigneeId: manager.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: director.id,
        type: NotificationType.VALIDATION_REQUESTED,
        title: "Validation demandée",
        body: `${validationTask.title} — ${clientB.name}`,
        taskId: validationTask.id,
      },
      {
        userId: director.id,
        type: NotificationType.TASK_OVERDUE,
        title: "Tâche en retard",
        body: "Déclaration TVA — mars — Atelier Lumière SARL",
      },
      {
        userId: c1.id,
        type: NotificationType.TASK_ASSIGNED,
        title: "Nouvelle tâche assignée",
        body: "TVA mensuelle",
      },
    ],
  });

  return {
    created: true,
    message:
      "Portefeuille de démo chargé : 3 clients, tâches, notifications et équipe.",
    accounts: [
      { email: director.email, role: "Votre compte (connecté)" },
      { email: manager.email, role: "Manager — mot de passe : demo123" },
      { email: c1.email, role: "Collaborateur — demo123" },
      { email: c2.email, role: "Collaborateur — demo123" },
    ],
  };
}
