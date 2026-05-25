import { redirect } from "next/navigation";
import { ensureAppReady, hasAnyUser } from "@/lib/app-config";
import { getSessionUser } from "@/lib/auth";
import { clearSession } from "@/lib/session";
import { getUnreadCount } from "@/lib/notifications";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureAppReady();
  if (!(await hasAnyUser())) redirect("/setup");

  const user = await getSessionUser();
  if (!user) {
    await clearSession();
    redirect("/login");
  }

  const unreadCount = await getUnreadCount(user.id);

  return (
    <AppShell user={user} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
