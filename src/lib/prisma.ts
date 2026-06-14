import { PrismaClient } from "@prisma/client";
import { scheduleSqlitePersistence } from "@/lib/sqlite-blob-sync";

const WRITE_OPS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

const base = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

const extended = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        const result = await query(args);
        if (WRITE_OPS.has(operation)) {
          scheduleSqlitePersistence();
        }
        return result;
      },
    },
  },
});

const globalForPrisma = globalThis as unknown as {
  prisma: typeof extended;
};

export const prisma = globalForPrisma.prisma ?? extended;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
