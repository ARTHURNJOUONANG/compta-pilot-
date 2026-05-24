"use client";

import { useActionState } from "react";
import { setupCabinetAction } from "@/actions/setup";

export default function SetupPage() {
  const [state, formAction, pending] = useActionState(setupCabinetAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-900">
          Configuration du cabinet
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Première utilisation : créez le compte administrateur (dirigeant). Aucune
          donnée de démonstration ne sera chargée.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Votre nom *
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email professionnel *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Mot de passe *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="passwordConfirm"
            >
              Confirmer le mot de passe *
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-rose-600" role="alert">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Création…" : "Créer mon cabinet"}
          </button>
        </form>
      </div>
    </div>
  );
}
