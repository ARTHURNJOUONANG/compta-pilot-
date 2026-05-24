"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-semibold text-slate-900">
          Compta Pilot
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Connexion à votre espace cabinet
        </p>
        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
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
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
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
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
