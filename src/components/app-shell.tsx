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
    <div className="app-gradient-bg flex min-h-screen w-full text-slate-900">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="ui-btn ui-btn-secondary rounded-lg px-3 py-2 text-sm"
          aria-label="Ouvrir le menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text font-bold text-transparent">
          Compta Pilot
        </span>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      </div>

      <Sidebar
        user={user}
        unreadCount={unreadCount}
        className={`fixed inset-y-0 left-0 z-50 shrink-0 shadow-xl shadow-slate-900/20 transition-transform duration-300 ease-out md:static md:translate-x-0 md:shadow-none ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onNavigate={() => setMenuOpen(false)}
      />

      <section className="flex min-h-screen flex-1 flex-col pt-14 md:pt-0">
        <main className="animate-page-enter flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </section>
    </div>
  );
}
