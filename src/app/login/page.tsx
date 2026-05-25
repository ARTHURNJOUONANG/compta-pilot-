"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <AuthShell
      title="Compta Pilot"
      subtitle="Connectez-vous avec l'email et le mot de passe créés lors de la configuration initiale du cabinet."
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            Email
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
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Connexion…
            </span>
          ) : (
            "Se connecter"
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-500">
        Le compte cabinet a déjà été créé.{" "}
        <Link href="/setup" className="font-medium text-slate-600 hover:underline">
          Vérifier le statut de l&apos;installation
        </Link>
      </p>
    </AuthShell>
  );
}
