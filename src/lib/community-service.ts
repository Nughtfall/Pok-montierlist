import { randomBytes } from "node:crypto";
import { db } from "@/lib/prisma";
import { communityTierListSchema } from "@/lib/validation";

export class CommunityValidationError extends Error {
  constructor(public status: number, message: string, public issues?: unknown) { super(message); }
}

async function validatedPayload(input: unknown) {
  const parsed = communityTierListSchema.safeParse(input);
  if (!parsed.success) throw new CommunityValidationError(422, "Invalid tier list", parsed.error.issues);
  const regulation = await db().regulation.findFirst({ where: { id: parsed.data.regulationId, format: parsed.data.format, verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, select: { id: true } });
  if (!regulation) throw new CommunityValidationError(422, "A verified matching regulation is required");
  const ids = parsed.data.entries.map((entry) => entry.pokemonId);
  if (new Set(ids).size !== ids.length) throw new CommunityValidationError(422, "Duplicate Pokémon entries are not allowed");
  if (ids.length) {
    const [available, legal] = await Promise.all([
      db().championsAvailability.count({ where: { pokemonId: { in: ids }, status: "AVAILABLE" } }),
      db().regulationPokemon.findMany({ where: { regulationId: regulation.id, pokemonId: { in: ids }, isLegal: true }, distinct: ["pokemonId"], select: { pokemonId: true } }),
    ]);
    if (available !== ids.length) throw new CommunityValidationError(422, "Every entry must be AVAILABLE in Pokémon Champions");
    if (legal.length !== ids.length) throw new CommunityValidationError(422, "Every entry must be legal in the selected regulation");
  }
  return parsed.data;
}

export async function createCommunityList(authorId: string, input: unknown) {
  const data = await validatedPayload(input);
  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tier-list";
  return db().communityTierList.create({
    data: { authorId, regulationId: data.regulationId, format: data.format, title: data.title, description: data.description, slug: `${baseSlug}-${randomBytes(4).toString("hex")}`, entries: { create: data.entries.map((entry, ranking) => ({ ...entry, ranking })) } },
    include: { entries: true },
  });
}

export async function updateCommunityList(authorId: string, id: string, input: unknown) {
  const data = await validatedPayload(input);
  const owned = await db().communityTierList.findFirst({ where: { id, authorId }, select: { id: true } });
  if (!owned) throw new CommunityValidationError(404, "Tier list not found");
  return db().$transaction(async (tx) => {
    await tx.communityTierEntry.deleteMany({ where: { tierListId: id } });
    return tx.communityTierList.update({ where: { id }, data: { regulationId: data.regulationId, format: data.format, title: data.title, description: data.description, entries: { create: data.entries.map((entry, ranking) => ({ ...entry, ranking })) } }, include: { entries: true } });
  });
}
