import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export function SetupAlreadyConfigured() {
  return (
    <AuthShell
      wide
      title="Cabinet déjà configuré"
      subtitle="Un compte dirigeant existe déjà dans cette installation. La création de compte n'est possible qu'une seule fois."
    >
      <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p>
          Utilisez la page de <strong>connexion</strong> avec l&apos;email et le mot de passe
          que vous avez définis lors de la première configuration.
        </p>
        <p className="text-xs text-amber-800">
          Si vous avez oublié vos identifiants, demandez à un administrateur système de
          réinitialiser la base (commande <code className="rounded bg-white/80 px-1">npm run db:reset</code> en
          développement — cela supprime toutes les données).
        </p>
      </div>
      <Link href="/login" className="ui-btn ui-btn-primary block w-full py-2.5 text-center">
        Aller à la connexion
      </Link>
    </AuthShell>
  );
}
