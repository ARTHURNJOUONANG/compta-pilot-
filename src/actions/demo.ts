"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loadDemoPortfolio } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export async function loadDemoDataAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user || user.role !== Role.DIRECTOR) {
    throw new Error("Seul le dirigeant peut charger les données de démo.");
  }

  await loadDemoPortfolio(prisma, user.id);

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/tasks");
  revalidatePath("/equipe");
  revalidatePath("/notifications");
  revalidatePath("/documents");
  revalidatePath("/rapport");

  redirect("/?demoLoaded=1");
}
