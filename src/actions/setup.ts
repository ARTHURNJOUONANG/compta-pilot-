"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";
import { setSessionUserId } from "@/lib/session";

export async function setupCabinetAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  if (await hasAnyUser()) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !email || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Cet email est déjà utilisé." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.DIRECTOR,
      reliabilityScore: 100,
      maxConcurrentTasks: 25,
    },
  });

  await setSessionUserId(user.id);
  redirect("/");
}
