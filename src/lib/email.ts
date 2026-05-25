import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type { NotificationType } from "@prisma/client";
import { isProduction } from "@/lib/env";

let transporter: Mail | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.MAILER_DSN ||
      (process.env.SMTP_HOST && process.env.EMAIL_FROM),
  );
}

function getTransporter(): Mail {
  if (transporter) return transporter;

  if (process.env.MAILER_DSN) {
    transporter = nodemailer.createTransport(process.env.MAILER_DSN);
    return transporter;
  }

  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
  return transporter;
}

function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function buildNotificationLink(params: {
  taskId?: string | null;
  clientId?: string | null;
}): string {
  const base = appBaseUrl();
  if (params.taskId) return `${base}/tasks/${params.taskId}`;
  if (params.clientId) return `${base}/clients/${params.clientId}`;
  return base;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<void> {
  if (!isEmailConfigured()) {
    if (isProduction()) {
      throw new Error(
        "SMTP non configuré : définissez MAILER_DSN ou SMTP_HOST en production.",
      );
    }
    console.warn(
      `[email:dev] ${params.to} — ${params.subject}\n${params.text}`,
    );
    return;
  }

  const from =
    process.env.EMAIL_FROM ?? "Compta Pilot <noreply@compta-pilot.local>";

  await getTransporter().sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text.replace(/\n/g, "<br>"),
    attachments: params.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
}

export async function sendContractSignedEmail(params: {
  to: string;
  contractTitle: string;
  clientName: string;
  cabinetSigner: string | null;
  signedAt: Date;
  pdfBuffer: Buffer;
  pdfFilename: string;
  message?: string;
  contractUrl: string;
}): Promise<void> {
  const dateLabel = params.signedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const intro = params.message?.trim()
    ? `${params.message.trim()}\n\n`
    : "";

  const text = [
    "Bonjour,",
    "",
    `${intro}Veuillez trouver ci-joint le contrat signé : ${params.contractTitle}.`,
    "",
    `Client : ${params.clientName}`,
    params.cabinetSigner ? `Signataire cabinet : ${params.cabinetSigner}` : "",
    `Date de signature : ${dateLabel}`,
    "",
    `Consulter en ligne : ${params.contractUrl}`,
    "",
    "— Compta Pilot",
  ]
    .filter(Boolean)
    .join("\n");

  const html = text.replace(/\n/g, "<br>");

  await sendEmail({
    to: params.to,
    subject: `[Compta Pilot] Contrat signé — ${params.clientName}`,
    text,
    html,
    attachments: [
      {
        filename: params.pdfFilename,
        content: params.pdfBuffer,
      },
    ],
  });
}

export async function sendNotificationEmail(params: {
  to: string;
  recipientName: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string | null;
  clientId?: string | null;
}): Promise<void> {
  const link = buildNotificationLink({
    taskId: params.taskId,
    clientId: params.clientId,
  });

  const subject = `[Compta Pilot] ${params.title}`;
  const text = [
    `Bonjour ${params.recipientName},`,
    "",
    params.title,
    params.body ?? "",
    "",
    `Ouvrir dans l'application : ${link}`,
    "",
    "— Compta Pilot",
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({ to: params.to, subject, text });
}
