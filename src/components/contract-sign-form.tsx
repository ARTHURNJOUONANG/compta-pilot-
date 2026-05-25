"use client";

import { signContractAction } from "@/actions/contracts";
import { ContractSignaturePad } from "@/components/contract-signature-pad";

type Props = {
  contractId: string;
  defaultCabinetSigner: string;
  defaultClientSigner?: string;
};

export function ContractSignForm({
  contractId,
  defaultCabinetSigner,
  defaultClientSigner = "",
}: Props) {
  const action = signContractAction.bind(null, contractId);

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Signatures électroniques</h2>
      <p className="text-sm text-slate-600">
        Les deux parties doivent signer ci-dessous. Le contrat passera au statut « Signé ».
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="cabinetSigner">
            Signataire cabinet *
          </label>
          <input
            id="cabinetSigner"
            name="cabinetSigner"
            required
            defaultValue={defaultCabinetSigner}
            className="ui-input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="clientSigner">
            Signataire client *
          </label>
          <input
            id="clientSigner"
            name="clientSigner"
            required
            defaultValue={defaultClientSigner}
            placeholder="Nom et qualité du représentant"
            className="ui-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ContractSignaturePad name="cabinetSignature" label="Signature du cabinet" />
        <ContractSignaturePad name="clientSignature" label="Signature du client" />
      </div>

      <button type="submit" className="ui-btn ui-btn-primary">
        Valider les signatures
      </button>
    </form>
  );
}
