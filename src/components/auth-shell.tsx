export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="auth-gradient-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl animate-float"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-24 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
        aria-hidden
      />

      <div
        className={`glass-panel animate-scale-in relative w-full rounded-2xl p-8 md:p-10 ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        <div className="mb-8 text-center">
          <div className="logo-badge mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold">
            CP
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
