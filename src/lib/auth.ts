import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}
