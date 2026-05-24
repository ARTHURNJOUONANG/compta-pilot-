import { NextResponse } from "next/server";
import { ensureSqliteDatabase } from "@/lib/ensure-sqlite-database";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSqliteDatabase();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      service: "compta-pilot",
      database: "connected",
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
