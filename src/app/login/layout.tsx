import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAnyUser())) {
    redirect("/setup");
  }
  return children;
}
