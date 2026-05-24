import { TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildCsv } from "@/lib/export-csv";
import { formatDateFr } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const today = startOfToday();
  const tasks = await prisma.task.findMany({
    where: {
      status: { not: TaskStatus.DONE },
      dueDate: { lt: today },
    },
    orderBy: [{ dueDate: "asc" }],
    include: {
      client: { select: { name: true } },
      assignee: { select: { name: true, email: true } },
    },
  });

  const csv = buildCsv(
    [
      "Tâche",
      "Client",
      "Assigné",
      "Email assigné",
      "Échéance",
      "Statut",
      "Priorité",
      "Catégorie",
    ],
    tasks.map((t) => [
      t.title,
      t.client.name,
      t.assignee?.name ?? "",
      t.assignee?.email ?? "",
      formatDateFr(t.dueDate),
      t.status,
      t.priority,
      t.category,
    ]),
  );

  const filename = `taches-en-retard-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
