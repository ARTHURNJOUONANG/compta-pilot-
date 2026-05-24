"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export function AppShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-white text-slate-900">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>
        <span className="font-semibold text-slate-900">Compta Pilot</span>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        unreadCount={unreadCount}
        className={`fixed inset-y-0 left-0 z-50 shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onNavigate={() => setMenuOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
