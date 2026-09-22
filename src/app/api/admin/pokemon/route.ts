import { db } from "@/lib/prisma";
import { adminPokemonSchema } from "@/lib/validation";
import { adminActor, adminOperationError, readJson, validationError } from "@/lib/admin-api";

export async function POST(request: Request) {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  const payload = await readJson(request); if ("response" in payload) return payload.response;
  const parsed = adminPokemonSchema.safeParse(payload.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { availability, sourceName, sourceUrl, notes, ...pokemonData } = parsed.data;
  try { const pokemon = await db().$transaction(async (tx) => {
    const created = await tx.pokemon.create({
      data: { ...pokemonData, strengths: [], weaknesses: [], availability: { create: { status: availability, checkedAt: new Date(), notes } } },
    });
    const source = await tx.dataSource.upsert({
      where: { url: sourceUrl },
      update: { name: sourceName },
      create: { name: sourceName, url: sourceUrl, isOfficial: pokemonData.verificationStatus === "OFFICIAL", accessedAt: new Date() },
    });
    await tx.dataVerification.create({
      data: { entityType: "Pokemon", entityId: created.id, sourceId: source.id, status: pokemonData.verificationStatus, checkedAt: new Date(), verifiedById: actor.id, notes },
    });
    await tx.changeLog.create({
      data: { entityType: "Pokemon", entityId: created.id, action: "CREATE", summary: `Created ${created.name}`, changedById: actor.id, after: { availability, sourceUrl } },
    });
    return created;
  });
  return Response.json({ data: pokemon }, { status: 201 }); } catch (error) { return adminOperationError(error); }
}
