import { z, ZodError } from "zod";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { duplicateTeam, TeamValidationError, updateTeam } from "@/lib/team-service";

const updateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), isPublic: z.boolean().optional() });

type TeamRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: TeamRouteContext) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid update", issues: parsed.error.issues }, { status: 422 });
  const current = await db().team.findFirst({ where: { id, ownerId: session.user.id } });
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });
  const team = await db().team.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.isPublic === true && !current.shareSlug ? { shareSlug: randomBytes(10).toString("hex") } : {}),
      ...(parsed.data.isPublic === false ? { shareSlug: null } : {}),
    },
  });
  return Response.json({ data: team });
}

export async function DELETE(_request: Request, context: TeamRouteContext) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const result = await db().team.deleteMany({ where: { id, ownerId: session.user.id } });
  return result.count ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function POST(_request: Request, context: TeamRouteContext) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const team = await duplicateTeam(session.user.id, id);
    return Response.json({ data: team }, { status: 201 });
  } catch {
    return Response.json({ error: "Team not found or no longer legal" }, { status: 404 });
  }
}

export async function PUT(request: Request, context: TeamRouteContext) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    return Response.json({ data: await updateTeam(session.user.id, id, await request.json()) });
  } catch (error) {
    if (error instanceof TeamValidationError || error instanceof ZodError) return Response.json({ error: "Invalid team", issues: error.issues }, { status: 422 });
    if (error instanceof Error && error.message === "Team not found") return Response.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
