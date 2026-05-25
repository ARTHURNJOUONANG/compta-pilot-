import Link from "next/link";
import { createClientAction } from "@/actions/clients";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link
          href="/clients"
          className="text-sm font-medium text-theme-link hover:underline"
        >
          ← Clients
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Nouveau client
        </h1>
      </div>

      <form
        action={createClientAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Raison sociale *
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="siret">
            SIRET
          </label>
          <input
            id="siret"
            name="siret"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="notes">
            Notes internes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="generateObligations"
            defaultChecked
            className="rounded border-emerald-500/50 text-emerald-600"
          />
          Générer les obligations standards (TVA, URSSAF, bilan, liasse)
        </label>
        <button
          type="submit"
          className="w-full rounded-xl ui-btn ui-btn-primary"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
