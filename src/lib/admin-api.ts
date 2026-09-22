import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export type AdminActor = { id: string; role: "ADMIN" };

export async function adminActor(): Promise<AdminActor | Response> {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db().user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, status: true } });
  if (!user || user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  return { id: user.id, role: "ADMIN" };
}

export async function readJson(request: Request) {
  try {
    return { data: await request.json() } as const;
  } catch {
    return { response: Response.json({ error: "Request body must be valid JSON" }, { status: 400 }) } as const;
  }
}

export function validationError(issues: unknown) {
  return Response.json({ error: "Invalid admin operation", issues }, { status: 422 });
}

export function adminOperationError(error: unknown) {
  if (error instanceof Response) return error;
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "P2025") return Response.json({ error: "Record not found" }, { status: 404 });
  if (code === "P2002") return Response.json({ error: "A unique field is already in use" }, { status: 409 });
  if (code === "P2003") return Response.json({ error: "This record is still referenced and cannot be deleted" }, { status: 409 });
  console.error("Admin operation failed", error);
  return Response.json({ error: "Admin operation failed" }, { status: 500 });
}
