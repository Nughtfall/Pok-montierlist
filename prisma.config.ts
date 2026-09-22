import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Client generation does not require a live database. Runtime access still
  // fails closed in src/lib/prisma.ts when DATABASE_URL is not configured.
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://unconfigured:unconfigured@localhost:5432/unconfigured" },
});
