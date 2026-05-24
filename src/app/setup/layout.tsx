import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await hasAnyUser()) {
    redirect("/login");
  }
  return children;
}
