"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { generateMonthlyTvaForAllClients } from "@/lib/task-templates";

export async function runMonthlyTvaAction() {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  if (user.role !== Role.DIRECTOR && user.role !== Role.MANAGER) {
    throw new Error("Réservé au directeur ou au manager");
  }

  const created = await generateMonthlyTvaForAllClients();

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/clients");
  revalidatePath("/notifications");

  redirect(`/?monthlyTva=${created}`);
}
