"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function markNotificationReadAction(notificationId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect("/notifications");
}
