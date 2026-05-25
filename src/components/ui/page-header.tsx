export function PageHeader({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-4 ${className}`}
    >
      <div className="space-y-2">
        <h1 className="text-theme-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-theme-body max-w-2xl text-sm leading-relaxed md:text-base">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="animate-scale-in stagger-2">{action}</div>
      )}
    </header>
  );
}
