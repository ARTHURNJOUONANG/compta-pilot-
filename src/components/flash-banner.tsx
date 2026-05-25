export function FlashBanner({
  message,
  variant = "success",
}: {
  message: string;
  variant?: "success" | "info" | "warning";
}) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900"
      : variant === "warning"
        ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900"
        : "border-sky-200 bg-gradient-to-r from-sky-50 to-slate-50 text-sky-900";

  return (
    <div
      className={`animate-fade-in-up ui-card rounded-xl px-4 py-3 text-sm font-medium ${styles}`}
      role="status"
    >
      {message}
    </div>
  );
}
