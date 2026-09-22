import { auth } from "@/auth";
import { db } from "@/lib/prisma";

type Context = { params: Promise<{ pokemonId: string }> };

export async function POST(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { pokemonId } = await context.params;
  const pokemon = await db().pokemon.findFirst({ where: { id: pokemonId, availability: { status: "AVAILABLE" } }, select: { id: true } });
  if (!pokemon) return Response.json({ error: "Pokémon is not in the available Champions roster" }, { status: 422 });
  const favorite = await db().favorite.upsert({ where: { userId_pokemonId: { userId: session.user.id, pokemonId } }, update: {}, create: { userId: session.user.id, pokemonId } });
  return Response.json({ data: favorite }, { status: 201 });
}

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { pokemonId } = await context.params;
  await db().favorite.deleteMany({ where: { userId: session.user.id, pokemonId } });
  return new Response(null, { status: 204 });
}
