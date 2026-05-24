function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variable d'environnement obligatoire manquante : ${name}. Voir .env.example`,
    );
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSessionSecret(): string {
  if (isProduction()) {
    return required("SESSION_SECRET");
  }
  return (
    process.env.SESSION_SECRET?.trim() ||
    "dev-only-insecure-secret-change-in-production"
  );
}

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function assertProductionConfig(): void {
  if (!isProduction() || isBuildPhase()) return;

  required("SESSION_SECRET");
  required("APP_URL");
  required("EMAIL_FROM");

  if (!process.env.MAILER_DSN && !process.env.SMTP_HOST) {
    throw new Error(
      "En production, configurez MAILER_DSN ou SMTP_HOST (+ SMTP_USER/SMTP_PASS).",
    );
  }
}
