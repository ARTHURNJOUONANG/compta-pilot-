"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ContractStatus,
  ContractTemplateType,
  Role,
} from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import {
  buildDefaultFields,
  getContractTemplate,
  renderContractBody,
} from "@/lib/contract-templates";
import { isEmailConfigured, sendContractSignedEmail } from "@/lib/email";
import {
  contractPdfFilename,
  generateContractPdfBuffer,
} from "@/lib/contract-pdf";
import { prisma } from "@/lib/prisma";

function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function parseFields(formData: FormData): Record<string, string> {
  const raw = String(formData.get("fieldsJson") ?? "{}");
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function createContractAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const clientId = String(formData.get("clientId") ?? "").trim();
  const templateType = String(
    formData.get("templateType") ?? "",
  ) as ContractTemplateType;

  if (!clientId) throw new Error("Client requis");
  if (!Object.values(ContractTemplateType).includes(templateType)) {
    throw new Error("Modèle invalide");
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Client introuvable");

  const template = getContractTemplate(templateType);
  const fields = buildDefaultFields(template, client);
  const renderedBody = renderContractBody(template.body, fields);

  const contract = await prisma.contract.create({
    data: {
      clientId,
      templateType,
      title: template.label,
      fieldsJson: JSON.stringify(fields),
      renderedBody,
      createdById: user.id,
    },
  });

  revalidatePath("/contrats");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/contrats/${contract.id}?created=1`);
}

export async function updateContractFieldsAction(
  contractId: string,
  formData: FormData,
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { client: true },
  });
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status === ContractStatus.SIGNED) {
    throw new Error("Un contrat signé ne peut plus être modifié");
  }

  const template = getContractTemplate(contract.templateType);
  const fields = parseFields(formData);

  for (const f of template.fields) {
    if (f.required && !String(fields[f.key] ?? "").trim()) {
      throw new Error(`Champ obligatoire : ${f.label}`);
    }
  }

  const renderedBody = renderContractBody(template.body, fields, {
    cabinet: contract.cabinetSigner ?? undefined,
    client: contract.clientSigner ?? undefined,
  });

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      fieldsJson: JSON.stringify(fields),
      renderedBody,
      status:
        contract.status === ContractStatus.CANCELLED
          ? ContractStatus.DRAFT
          : contract.status,
    },
  });

  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/contrats");
  redirect(`/contrats/${contractId}?saved=1`);
}

export async function markContractPendingSignatureAction(contractId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status === ContractStatus.SIGNED) {
    throw new Error("Contrat déjà signé");
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: ContractStatus.PENDING_SIGNATURE },
  });

  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/contrats");
  redirect(`/contrats/${contractId}?ready=1`);
}

export async function signContractAction(
  contractId: string,
  formData: FormData,
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status === ContractStatus.SIGNED) {
    throw new Error("Contrat déjà signé");
  }

  const cabinetSigner =
    String(formData.get("cabinetSigner") ?? "").trim() || user.name;
  const clientSigner = String(formData.get("clientSigner") ?? "").trim();
  const cabinetSignature = String(formData.get("cabinetSignature") ?? "").trim();
  const clientSignature = String(formData.get("clientSignature") ?? "").trim();

  if (!clientSigner) throw new Error("Nom du signataire client requis");
  if (!cabinetSignature) throw new Error("Signature du cabinet requise");
  if (!clientSignature) throw new Error("Signature du client requise");

  const fields = JSON.parse(contract.fieldsJson) as Record<string, string>;
  const template = getContractTemplate(contract.templateType);
  const renderedBody = renderContractBody(template.body, fields, {
    cabinet: cabinetSigner,
    client: clientSigner,
  });

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.SIGNED,
      cabinetSigner,
      clientSigner,
      cabinetSignature,
      clientSignature,
      renderedBody,
      signedAt: new Date(),
    },
  });

  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/contrats");
  revalidatePath(`/clients/${contract.clientId}`);
  redirect(`/contrats/${contractId}?signed=1`);
}

export async function cancelContractAction(contractId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  if (user.role === Role.COLLABORATOR) {
    throw new Error("Seuls le directeur et le manager peuvent annuler un contrat");
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new Error("Contrat introuvable");

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: ContractStatus.CANCELLED },
  });

  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/contrats");
  redirect(`/contrats/${contractId}?cancelled=1`);
}

export async function deleteContractAction(contractId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  if (user.role === Role.COLLABORATOR) {
    throw new Error("Seuls le directeur et le manager peuvent supprimer un contrat");
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status === ContractStatus.SIGNED) {
    throw new Error("Un contrat signé ne peut pas être supprimé");
  }

  const clientId = contract.clientId;
  await prisma.contract.delete({ where: { id: contractId } });

  revalidatePath("/contrats");
  revalidatePath(`/clients/${clientId}`);
  redirect("/contrats");
}

export async function sendContractByEmailAction(
  contractId: string,
  formData: FormData,
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      client: { select: { name: true, email: true, siret: true } },
    },
  });
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status !== ContractStatus.SIGNED) {
    throw new Error("Seuls les contrats signés peuvent être envoyés par email");
  }

  const to = String(formData.get("email") ?? "").trim().toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    redirect(
      `/contrats/${contractId}?emailError=${encodeURIComponent("Adresse email invalide")}`,
    );
  }

  try {
    const pdfBuffer = await generateContractPdfBuffer(contract);
    const pdfFilename = contractPdfFilename(contract);

    await sendContractSignedEmail({
      to,
      contractTitle: contract.title,
      clientName: contract.client.name,
      cabinetSigner: contract.cabinetSigner,
      signedAt: contract.signedAt ?? new Date(),
      pdfBuffer,
      pdfFilename,
      message: message || undefined,
      contractUrl: `${appBaseUrl()}/contrats/${contract.id}`,
    });

    revalidatePath(`/contrats/${contractId}`);
    const emailedParam = isEmailConfigured() ? "emailed=1" : "emailed=dev";
    redirect(`/contrats/${contractId}?${emailedParam}`);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Échec de l'envoi de l'email";
    redirect(`/contrats/${contractId}?emailError=${encodeURIComponent(msg)}`);
  }
}
