import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, email: true, image: true, role: true, status: true },
  });
});

export async function requireUser() {
  const user = await currentUser();
  if (!user || user.status !== "ACTIVE") throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Response("Forbidden", { status: 403 });
  return user;
}
