import Link from "next/link";
import { sendContractByEmailAction } from "@/actions/contracts";

type Props = {
  contractId: string;
  defaultEmail?: string | null;
  clientName: string;
  emailConfigured: boolean;
};

export function ContractSignedActions({
  contractId,
  defaultEmail,
  clientName,
  emailConfigured,
}: Props) {
  const pdfUrl = `/api/contracts/${contractId}/pdf`;
  const sendAction = sendContractByEmailAction.bind(null, contractId);
  const smtpReady = emailConfigured;

  return (
    <section className="space-y-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Contrat signé — envoi &amp; archivage
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Téléchargez le PDF officiel ou envoyez-le par email à {clientName} (ou
          un autre destinataire).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={pdfUrl}
          download
          className="ui-btn ui-btn-primary inline-flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Télécharger le PDF
        </a>
        <Link
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-btn ui-btn-secondary"
        >
          Ouvrir le PDF
        </Link>
      </div>

      <form action={sendAction} className="space-y-4 border-t border-emerald-200/80 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Envoyer par email</h3>
        {!smtpReady && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            SMTP non configuré : en développement, le contenu de l&apos;email est
            affiché dans la console du serveur. Le PDF est tout de même généré.
          </p>
        )}
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="contract-email">
            Destinataire *
          </label>
          <input
            id="contract-email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail ?? ""}
            placeholder="client@entreprise.fr"
            className="ui-input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="contract-message">
            Message personnalisé (optionnel)
          </label>
          <textarea
            id="contract-message"
            name="message"
            rows={3}
            placeholder="Bonjour, veuillez trouver ci-joint votre contrat signé…"
            className="ui-input mt-1"
          />
        </div>
        <button type="submit" className="ui-btn ui-btn-dark">
          Envoyer le contrat par email
        </button>
        <p className="text-xs text-slate-500">
          Le PDF signé est joint automatiquement à l&apos;email.
        </p>
      </form>
    </section>
  );
}
