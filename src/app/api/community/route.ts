import { auth } from "@/auth";
import { CommunityValidationError, createCommunityList } from "@/lib/community-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ data: await createCommunityList(session.user.id, await request.json()) }, { status: 201 });
  } catch (error) {
    if (error instanceof CommunityValidationError) return Response.json({ error: error.message, issues: error.issues }, { status: error.status });
    throw error;
  }
}
