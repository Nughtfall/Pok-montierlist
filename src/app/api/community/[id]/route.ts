import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { CommunityValidationError, updateCommunityList } from "@/lib/community-service";

const managementSchema = z.object({ isPublic: z.boolean() });
type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try { return Response.json({ data: await updateCommunityList(session.user.id, id, await request.json()) }); }
  catch (error) { if (error instanceof CommunityValidationError) return Response.json({ error: error.message, issues: error.issues }, { status: error.status }); throw error; }
}

export async function PATCH(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = managementSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid update", issues: parsed.error.issues }, { status: 422 });
  const { id } = await context.params;
  const result = await db().communityTierList.updateMany({ where: { id, authorId: session.user.id }, data: { isPublic: parsed.data.isPublic } });
  return result.count ? Response.json({ data: { id, ...parsed.data } }) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const result = await db().communityTierList.deleteMany({ where: { id, authorId: session.user.id } });
  return result.count ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 });
}
