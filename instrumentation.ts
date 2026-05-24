export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSqliteDatabase } = await import("@/lib/ensure-sqlite-database");
    const { assertProductionConfig } = await import("@/lib/env");
    await ensureSqliteDatabase();
    assertProductionConfig();
  }
}
