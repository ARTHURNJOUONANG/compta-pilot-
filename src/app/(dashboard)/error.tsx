"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-8">
      <h1 className="text-xl font-semibold text-rose-950">
        Impossible d&apos;afficher cette page
      </h1>
      <p className="text-sm text-rose-900/90">
        {error.message ||
          "Une erreur inattendue s'est produite. Si vous venez de mettre à jour l'application, exécutez `npm run db:push` puis rechargez."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
      >
        Réessayer
      </button>
    </div>
  );
}
