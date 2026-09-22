import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = z.object({ value: z.enum(["UP", "DOWN"]) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid vote" }, { status: 422 });
  const exists = await db().communityTierList.findFirst({ where: { id, isPublic: true, moderationStatus: "PUBLISHED" }, select: { id: true } });
  if (!exists) return Response.json({ error: "Not found" }, { status: 404 });
  const vote = await db().vote.upsert({ where: { userId_tierListId: { userId: session.user.id, tierListId: id } }, update: { value: parsed.data.value }, create: { userId: session.user.id, tierListId: id, value: parsed.data.value } });
  return Response.json({ data: vote });
}
