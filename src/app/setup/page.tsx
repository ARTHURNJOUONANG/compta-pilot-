"use client";

import { useActionState } from "react";
import { setupCabinetAction } from "@/actions/setup";
import { AuthShell } from "@/components/auth-shell";

export default function SetupPage() {
  const [state, formAction, pending] = useActionState(setupCabinetAction, undefined);

  return (
    <AuthShell
      wide
      title="Créer votre compte"
      subtitle="Première étape : enregistrez le compte dirigeant du cabinet (une seule fois). Aucune donnée de démonstration — vos vraies informations uniquement."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="name">
            Votre nom *
          </label>
          <input id="name" name="name" required className="ui-input mt-1.5" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            Email professionnel *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="ui-input mt-1.5"
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-600"
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
            className="ui-input mt-1.5"
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-600"
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
            className="ui-input mt-1.5"
          />
        </div>
        {state?.error && (
          <p
            className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            role="alert"
          >
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ui-btn ui-btn-primary w-full py-2.5"
        >
          {pending ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </AuthShell>
  );
}
