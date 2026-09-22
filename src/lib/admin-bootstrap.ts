import { z } from "zod";
import { db } from "@/lib/prisma";

export async function promoteFirstAdmin(input: string) {
  const email = z.string().trim().toLowerCase().pipe(z.email()).parse(input);
  const client = db();
  return client.$transaction(async (tx) => {
    // Serialize the one-time bootstrap so simultaneous deploy jobs cannot create
    // two first administrators. PostgreSQL is the only supported database.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(827100642)::text AS lock_status`;
    const activeAdmins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeAdmins > 0) throw new Error("An active administrator already exists. Use the protected admin console for later role changes.");

    const user = await tx.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, status: true } });
    if (!user) throw new Error("No registered account matches ADMIN_EMAIL. Register the account first.");
    if (user.status !== "ACTIVE") throw new Error("The selected account is suspended and cannot become the first administrator.");

    const updated = await tx.user.update({ where: { id: user.id }, data: { role: "ADMIN" }, select: { id: true, email: true, role: true, status: true } });
    await tx.changeLog.create({
      data: {
        entityType: "User",
        entityId: user.id,
        action: "BOOTSTRAP_ADMIN",
        summary: `Promoted first administrator ${user.email} through the operator workflow`,
        before: { role: user.role },
        after: { role: "ADMIN", status: "ACTIVE" },
      },
    });
    return updated;
  });
}
