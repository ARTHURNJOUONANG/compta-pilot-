import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureAppReady } from "@/lib/app-config";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export async function ensureApiReady(): Promise<void> {
  await ensureAppReady();
}

export async function requireApiUser(): Promise<
  SessionUser | NextResponse
> {
  await ensureApiReady();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return user;
}

export function requireApiRole(
  user: SessionUser,
  roles: Role[],
): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}
