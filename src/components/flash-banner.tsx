export function FlashBanner({
  message,
  variant = "success",
}: {
  message: string;
  variant?: "success" | "info";
}) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}
      role="status"
    >
      {message}
    </div>
  );
}
