import { hasAnyUser } from "@/lib/app-config";
import { SetupAlreadyConfigured } from "./already-configured";

export const dynamic = "force-dynamic";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await hasAnyUser()) {
    return <SetupAlreadyConfigured />;
  }
  return children;
}
