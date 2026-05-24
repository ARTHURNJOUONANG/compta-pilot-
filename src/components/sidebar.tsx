import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/tasks", label: "Tâches" },
  { href: "/documents", label: "Coffre-fort" },
  { href: "/rapport", label: "Rapport" },
  { href: "/equipe", label: "Équipe" },
  { href: "/notifications", label: "Notifications" },
] as const;

export function Sidebar({
  user,
  unreadCount,
  className = "",
  onNavigate,
}: {
  user: SessionUser;
  unreadCount: number;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 ${className}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Cabinet
        </p>
        <p className="mt-1 font-semibold text-slate-900">Compta Pilot</p>
        <p className="mt-2 text-sm text-slate-600">{user.name}</p>
        <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links
          .filter(
            (l) =>
              l.href !== "/rapport" ||
              user.role === "DIRECTOR" ||
              user.role === "MANAGER",
          )
          .map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-900"
          >
            <span>{l.label}</span>
            {l.href === "/notifications" && unreadCount > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <form action={logoutAction} className="border-t border-slate-200 p-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          Déconnexion
        </button>
      </form>
    </aside>
  );
}
