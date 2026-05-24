"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateClientObligations } from "@/lib/task-templates";
import { purgeClientDocuments } from "@/lib/documents";
export async function createClientAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nom requis");
  const generateObligations =
    String(formData.get("generateObligations") ?? "") === "on";
  const client = await prisma.client.create({
    data: {
      name,
      siret: String(formData.get("siret") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  let tasksCreated = 0;
  if (generateObligations) {
    tasksCreated = await generateClientObligations(client.id, {
      autoAssign: true,
    });
  }
  revalidatePath("/clients");
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/notifications");
  const q = tasksCreated > 0 ? `?tasksCreated=${tasksCreated}` : "";
  redirect(`/clients/${client.id}${q}`);
}
export async function updateClientAction(clientId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nom requis");
  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      siret: String(formData.get("siret") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  redirect(`/clients/${clientId}?saved=1`);
}
export async function regenerateObligationsAction(clientId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const created = await generateClientObligations(clientId, { autoAssign: true });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/notifications");
  redirect(`/clients/${clientId}?tasksCreated=${created}`);
}
export async function deleteClientAction(clientId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  if (user.role === "COLLABORATOR") {
    throw new Error("Seuls le directeur et le manager peuvent supprimer un client");
  }
  await purgeClientDocuments(clientId);
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/documents");
  redirect("/clients");
}
