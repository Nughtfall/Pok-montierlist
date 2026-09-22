import { db, isDatabaseConfigured } from "../src/lib/prisma";
import { promoteFirstAdmin } from "../src/lib/admin-bootstrap";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required.");
  if (!email) throw new Error("ADMIN_EMAIL is required and must match an existing registered account.");
  const user = await promoteFirstAdmin(email);
  console.log(`First administrator promoted: ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Administrator promotion failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) await db().$disconnect();
  });
