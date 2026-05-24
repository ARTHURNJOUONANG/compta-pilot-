import Link from "next/link";
import { loadDemoDataAction } from "@/actions/demo";
import { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";

export function DemoLoadBanner({
  user,
  clientCount,
  showSuccess,
}: {
  user: SessionUser;
  clientCount: number;
  showSuccess?: boolean;
}) {
  if (user.role !== Role.DIRECTOR) return null;

  if (showSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        <p className="font-semibold">Portefeuille de démo chargé</p>
        <p className="mt-1">
          Comptes test (mot de passe <code className="rounded bg-white px-1">demo123</code>
          ) : manager@cabinet.fr, sophie@cabinet.fr, lucas@cabinet.fr
        </p>
      </div>
    );
  }

  if (clientCount > 0) return null;

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-4 text-sm text-sky-950">
      <p className="font-semibold">Cabinet vide — prêt pour une démo ?</p>
      <p className="mt-1 text-sky-900/90">
        Chargez un portefeuille exemple : 3 clients, tâches en retard, validation en
        attente, équipe et notifications.
      </p>
      <form action={loadDemoDataAction} className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Charger les données de démo
        </button>
        <Link
          href="/clients/new"
          className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
        >
          Créer un client manuellement
        </Link>
      </form>
    </div>
  );
}
