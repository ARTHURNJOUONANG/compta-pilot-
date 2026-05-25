import { NextResponse } from "next/server";
import {
  ensureSqliteDatabase,
  resolveSqliteTemplatePath,
} from "@/lib/ensure-sqlite-database";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "User",
  "Client",
  "Task",
  "Document",
  "Notification",
  "Contract",
] as const;

export async function GET() {
  try {
    await ensureSqliteDatabase();
    await prisma.$queryRaw`SELECT 1`;

    const tables = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name IN ('User', 'Client', 'Task', 'Document', 'Notification', 'Contract')
    `;
    const tableNames = new Set(tables.map((t) => t.name));
    const missing = REQUIRED_TABLES.filter((t) => !tableNames.has(t));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          service: "compta-pilot",
          database: "schema_incomplete",
          missingTables: missing,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const [users, clients, tasks, documents, contracts] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.task.count(),
      prisma.document.count(),
      prisma.contract.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      service: "compta-pilot",
      database: "connected",
      schema: "complete",
      counts: { users, clients, tasks, documents, contracts },
      email: isEmailConfigured() ? "configured" : "dev_log_only",
      templateDb: resolveSqliteTemplatePath(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        status: "error",
        service: "compta-pilot",
        database: "failed",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
