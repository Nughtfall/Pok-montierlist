import { db, isDatabaseConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) return Response.json({ status: "degraded", database: "not_configured" }, { status: 503 });
  try {
    await db().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}
