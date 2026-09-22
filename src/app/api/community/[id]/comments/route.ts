import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { commentSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid comment", issues: parsed.error.issues }, { status: 422 });
  const exists = await db().communityTierList.findFirst({ where: { id, isPublic: true, moderationStatus: "PUBLISHED" }, select: { id: true } });
  if (!exists) return Response.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.parentId) {
    const parent = await db().comment.findFirst({ where: { id: parsed.data.parentId, tierListId: id, moderationStatus: "PUBLISHED" }, select: { id: true } });
    if (!parent) return Response.json({ error: "Invalid parent comment" }, { status: 422 });
  }
  const comment = await db().comment.create({ data: { authorId: session.user.id, tierListId: id, ...parsed.data } });
  return Response.json({ data: comment }, { status: 201 });
}
