import Link from "next/link";
import { createContractAction } from "@/actions/contracts";
import { CONTRACT_TEMPLATES } from "@/lib/contract-templates";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams?: Promise<{ clientId?: string }>;
};

export default async function NewContractPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/contrats" className="text-sm font-medium text-theme-link hover:underline">
          ← Contrats
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Nouveau contrat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez le client et le modèle. Les champs seront préremplis depuis la fiche client.
        </p>
      </div>

      <form
        action={createContractAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="clientId">
            Client *
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={sp.clientId ?? ""}
            className="ui-input mt-1"
          >
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Modèle de contrat *</legend>
          {CONTRACT_TEMPLATES.map((t) => (
            <label
              key={t.type}
              className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:bg-emerald-50/50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                type="radio"
                name="templateType"
                value={t.type}
                required
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-slate-900">{t.label}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{t.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button type="submit" className="ui-btn ui-btn-primary">
          Créer et remplir
        </button>
      </form>
    </div>
  );
}
