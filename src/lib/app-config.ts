import { prisma } from "@/lib/prisma";
import { assertProductionConfig } from "@/lib/env";

let bootChecked = false;

export async function ensureAppReady(): Promise<void> {
  if (!bootChecked) {
    assertProductionConfig();
    bootChecked = true;
  }
}

export async function hasAnyUser(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}
