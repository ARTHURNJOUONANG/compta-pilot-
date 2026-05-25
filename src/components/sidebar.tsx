"use client";

import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import { SidebarNav } from "@/components/sidebar-nav";

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
      className={`sidebar-shell flex w-64 shrink-0 flex-col border-r backdrop-blur-xl ${className}`}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="logo-badge flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
            CP
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Cabinet
            </p>
            <p className="font-bold tracking-tight text-white">Compta Pilot</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <p className="text-sm font-medium text-slate-100">{user.name}</p>
          <p className="text-xs font-medium text-slate-400">
            {roleLabel(user.role)}
          </p>
        </div>
      </div>

      <SidebarNav
        user={user}
        unreadCount={unreadCount}
        onNavigate={onNavigate}
      />

      <form action={logoutAction} className="border-t border-white/10 p-3">
        <button
          type="submit"
          className="ui-btn ui-btn-ghost w-full justify-start rounded-xl px-3 py-2.5 text-sm"
        >
          Déconnexion
        </button>
      </form>
    </aside>
  );
}
