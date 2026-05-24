"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ensureAppReady, hasAnyUser } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";
import { clearSession, setSessionUserId } from "@/lib/session";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email et mot de passe requis." };

  await ensureAppReady();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Identifiants incorrects." };
  }

  await setSessionUserId(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function getLoginRedirectPath(): Promise<string> {
  const exists = await hasAnyUser();
  return exists ? "/login" : "/setup";
}
