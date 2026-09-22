import { ZodError } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { createTeam, TeamValidationError } from "@/lib/team-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const teams = await db().team.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { regulation: { select: { name: true } }, _count: { select: { pokemon: true } } },
  });
  return Response.json({ data: teams });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const team = await createTeam(session.user.id, await request.json());
    return Response.json({ data: team }, { status: 201 });
  } catch (error) {
    if (error instanceof TeamValidationError || error instanceof ZodError) {
      return Response.json({ error: "Invalid team", issues: error instanceof ZodError ? error.issues : error.issues }, { status: 422 });
    }
    throw error;
  }
}
