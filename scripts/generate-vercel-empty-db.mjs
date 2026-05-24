import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const dbPath = path.join("prisma", "vercel-empty.db");
if (existsSync(dbPath)) unlinkSync(dbPath);

execSync("npx prisma db push --skip-generate", {
  env: { ...process.env, DATABASE_URL: "file:./vercel-empty.db" },
  stdio: "inherit",
  cwd: path.join(process.cwd(), "prisma"),
});

console.log(`Template créé : ${dbPath}`);
