import {
  NotificationType,
  PrismaClient,
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateClientObligations } from "../src/lib/task-templates";

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEMO !== "true") {
    console.log(
      "Seed ignoré (mode production). Pour les données de démo : SEED_DEMO=true npm run db:seed",
    );
    return;
  }

  const hash = await bcrypt.hash("demo123", 10);

  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const director = await prisma.user.create({
    data: {
      email: "directeur@cabinet.fr",
      name: "Marie Dupont",
      role: Role.DIRECTOR,
      passwordHash: hash,
      reliabilityScore: 98,
      maxConcurrentTasks: 20,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@cabinet.fr",
      name: "Jean Martin",
      role: Role.MANAGER,
      passwordHash: hash,
      reliabilityScore: 92,
      maxConcurrentTasks: 15,
    },
  });

  const c1 = await prisma.user.create({
    data: {
      email: "sophie@cabinet.fr",
      name: "Sophie Bernard",
      role: Role.COLLABORATOR,
      passwordHash: hash,
      reliabilityScore: 88,
      maxConcurrentTasks: 8,
    },
  });

  const c2 = await prisma.user.create({
    data: {
      email: "lucas@cabinet.fr",
      name: "Lucas Petit",
      role: Role.COLLABORATOR,
      passwordHash: hash,
      reliabilityScore: 72,
      maxConcurrentTasks: 8,
    },
  });

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

  console.log("Seed OK — comptes (mot de passe: demo123):");
  console.log(" ", director.email, "(directeur)");
  console.log(" ", manager.email, "(manager)");
  console.log(" ", c1.email, ",", c2.email, "(collaborateurs)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
