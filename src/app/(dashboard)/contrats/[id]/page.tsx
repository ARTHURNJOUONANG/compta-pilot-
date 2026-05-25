import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractStatus, Role } from "@prisma/client";
import {
  cancelContractAction,
  deleteContractAction,
  markContractPendingSignatureAction,
  updateContractFieldsAction,
} from "@/actions/contracts";
import { ContractFieldsForm } from "@/components/contract-fields-form";
import { ContractSignForm } from "@/components/contract-sign-form";
import { ContractSignedActions } from "@/components/contract-signed-actions";
import { FlashBanner } from "@/components/flash-banner";
import { getContractTemplate } from "@/lib/contract-templates";
import {
  contractStatusClass,
  contractStatusLabel,
  contractTemplateLabel,
} from "@/lib/contracts";
import { formatDateFr } from "@/lib/dates";
import { getSessionUser } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    saved?: string;
    ready?: string;
    signed?: string;
    cancelled?: string;
    emailed?: string;
    emailError?: string;
  }>;
};

export default async function ContractDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: { select: { name: true } },
    },
  });
  if (!contract) notFound();

  const template = getContractTemplate(contract.templateType);
  const fields = JSON.parse(contract.fieldsJson) as Record<string, string>;
  const canManage =
    user?.role === Role.DIRECTOR || user?.role === Role.MANAGER;
  const isEditable = contract.status !== ContractStatus.SIGNED;
  const canSign =
    contract.status === ContractStatus.PENDING_SIGNATURE ||
    contract.status === ContractStatus.DRAFT;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {sp.created === "1" && (
        <FlashBanner message="Contrat créé. Complétez les champs puis passez en signature." />
      )}
      {sp.saved === "1" && (
        <FlashBanner message="Champs enregistrés." />
      )}
      {sp.ready === "1" && (
        <FlashBanner
          message="Contrat prêt pour signature."
          variant="info"
        />
      )}
      {sp.signed === "1" && (
        <FlashBanner message="Contrat signé par les deux parties." />
      )}
      {sp.cancelled === "1" && (
        <FlashBanner message="Contrat annulé." variant="info" />
      )}
      {sp.emailed === "1" && (
        <FlashBanner message="Contrat envoyé par email avec le PDF en pièce jointe." />
      )}
      {sp.emailed === "dev" && (
        <FlashBanner
          message="Email simulé (voir la console serveur). Configurez MAILER_DSN ou SMTP_* pour un envoi réel."
          variant="info"
        />
      )}
      {sp.emailError && (
        <FlashBanner
          message={decodeURIComponent(sp.emailError)}
          variant="info"
        />
      )}

      <div>
        <Link href="/contrats" className="text-sm font-medium text-theme-link hover:underline">
          ← Contrats
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{contract.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              <Link
                href={`/clients/${contract.clientId}`}
                className="text-theme-link font-medium hover:underline"
              >
                {contract.client.name}
              </Link>
              {" · "}
              {contractTemplateLabel(contract.templateType)}
              {contract.createdBy && ` · Créé par ${contract.createdBy.name}`}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${contractStatusClass(contract.status)}`}
          >
            {contractStatusLabel(contract.status)}
          </span>
        </div>
        {contract.signedAt && (
          <p className="mt-2 text-sm text-emerald-700">
            Signé le {formatDateFr(contract.signedAt)}
            {contract.cabinetSigner && ` · Cabinet : ${contract.cabinetSigner}`}
            {contract.clientSigner && ` · Client : ${contract.clientSigner}`}
          </p>
        )}
      </div>

      {isEditable && (
        <div className="flex flex-wrap gap-3">
          {contract.status === ContractStatus.DRAFT && (
            <form action={markContractPendingSignatureAction.bind(null, contract.id)}>
              <button type="submit" className="ui-btn ui-btn-secondary">
                Marquer prêt pour signature
              </button>
            </form>
          )}
          {canManage && contract.status !== ContractStatus.CANCELLED && (
            <form action={cancelContractAction.bind(null, contract.id)}>
              <button
                type="submit"
                className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
              >
                Annuler le contrat
              </button>
            </form>
          )}
          {canManage && (
            <form action={deleteContractAction.bind(null, contract.id)}>
              <button
                type="submit"
                className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Supprimer
              </button>
            </form>
          )}
        </div>
      )}

      {isEditable ? (
        <ContractFieldsForm
          fields={template.fields}
          initialValues={fields}
          bodyTemplate={template.body}
          action={updateContractFieldsAction.bind(null, contract.id)}
          submitLabel="Enregistrer les champs"
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Contrat signé</h2>
          <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed text-slate-800">
            {contract.renderedBody}
          </pre>
        </section>
      )}

      {canSign && isEditable && user && (
        <ContractSignForm
          contractId={contract.id}
          defaultCabinetSigner={contract.cabinetSigner ?? user.name}
          defaultClientSigner={contract.clientSigner ?? contract.client.name}
        />
      )}

      {contract.status === ContractStatus.SIGNED && (
        <ContractSignedActions
          contractId={contract.id}
          defaultEmail={contract.client.email}
          clientName={contract.client.name}
          emailConfigured={isEmailConfigured()}
        />
      )}

      {contract.status === ContractStatus.SIGNED &&
        (contract.cabinetSignature || contract.clientSignature) && (
          <section className="grid gap-6 md:grid-cols-2">
            {contract.cabinetSignature && (
              <SignatureBlock
                title="Signature cabinet"
                signer={contract.cabinetSigner}
                dataUrl={contract.cabinetSignature}
              />
            )}
            {contract.clientSignature && (
              <SignatureBlock
                title="Signature client"
                signer={contract.clientSigner}
                dataUrl={contract.clientSignature}
              />
            )}
          </section>
        )}
    </div>
  );
}

function SignatureBlock({
  title,
  signer,
  dataUrl,
}: {
  title: string;
  signer: string | null;
  dataUrl: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {signer && <p className="text-xs text-slate-500">{signer}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={title}
        className="mt-3 max-h-24 w-full object-contain object-left"
      />
    </div>
  );
}
