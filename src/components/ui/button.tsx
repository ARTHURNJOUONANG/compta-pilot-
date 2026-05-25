import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";

const variantClass: Record<ButtonVariant, string> = {
  primary: "ui-btn ui-btn-primary",
  secondary: "ui-btn ui-btn-secondary",
  ghost: "ui-btn ui-btn-ghost",
  dark: "ui-btn ui-btn-dark",
  danger:
    "ui-btn bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-60",
};

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={`${variantClass[variant]} ${className}`}>
      {children}
    </Link>
  );
}
