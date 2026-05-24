"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canManageUsers(role: Role): boolean {
  return role === Role.DIRECTOR || role === Role.MANAGER;
}

export async function createUserAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) throw new Error("Non authentifié");
  if (!canManageUsers(session.role)) {
    throw new Error("Seuls le directeur et le manager peuvent créer des comptes");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? Role.COLLABORATOR) as Role;

  if (!name || !email || !password) {
    throw new Error("Nom, email et mot de passe requis");
  }
  if (password.length < 8) {
    throw new Error("Mot de passe : 8 caractères minimum");
  }
  if (!Object.values(Role).includes(role)) {
    throw new Error("Rôle invalide");
  }
  if (role === Role.DIRECTOR && session.role !== Role.DIRECTOR) {
    throw new Error("Seul un directeur peut créer un compte directeur");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email déjà utilisé");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      reliabilityScore: 75,
      maxConcurrentTasks: role === Role.COLLABORATOR ? 8 : 15,
    },
  });

  revalidatePath("/equipe");
  redirect("/equipe?userCreated=1");
}
