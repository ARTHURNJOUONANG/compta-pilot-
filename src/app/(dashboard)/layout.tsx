import { redirect } from "next/navigation";
import { ensureAppReady, hasAnyUser } from "@/lib/app-config";
import { getSessionUser } from "@/lib/auth";
import { clearSession } from "@/lib/session";
import { getUnreadCount } from "@/lib/notifications";
import { refreshSqliteFromBlob } from "@/lib/ensure-sqlite-database";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureAppReady();

  let hasUsers = await hasAnyUser();
  if (!hasUsers && process.env.VERCEL) {
    if (await refreshSqliteFromBlob()) {
      hasUsers = await hasAnyUser();
    }
  }
  if (!hasUsers) redirect("/setup");

  let user = await getSessionUser();
  if (!user && process.env.VERCEL) {
    if (await refreshSqliteFromBlob()) {
      user = await getSessionUser();
    }
  }
  if (!user) {
    await clearSession();
    redirect("/login?reauth=1");
  }

  const unreadCount = await getUnreadCount(user.id);

  return (
    <AppShell user={user} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
