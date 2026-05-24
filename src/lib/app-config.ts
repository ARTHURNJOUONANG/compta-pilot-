import { prisma } from "@/lib/prisma";
import { assertProductionConfig } from "@/lib/env";
import { ensureSqliteDatabase } from "@/lib/ensure-sqlite-database";

let bootChecked = false;

export async function ensureAppReady(): Promise<void> {
  if (!bootChecked) {
    await ensureSqliteDatabase();
    assertProductionConfig();
    bootChecked = true;
  }
}

export async function hasAnyUser(): Promise<boolean> {
  await ensureSqliteDatabase();
  const count = await prisma.user.count();
  return count > 0;
}
