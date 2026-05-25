export function StatCard({
  label,
  value,
  hint,
  danger = false,
  delay = 0,
}: {
  label: string;
  value: number | string;
  hint?: string;
  danger?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={`ui-card ui-card-hover animate-fade-in-up p-5 ${
        danger
          ? "border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white"
          : "bg-gradient-to-br from-white to-slate-50"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${
          danger ? "text-rose-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`ui-card overflow-hidden ${hover ? "ui-card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}
