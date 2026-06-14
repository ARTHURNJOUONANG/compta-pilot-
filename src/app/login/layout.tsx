import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/app-config";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAnyUser())) {
    redirect("/setup");
  }

  const user = await getSessionUser();
  if (user) redirect("/");

  return children;
}
