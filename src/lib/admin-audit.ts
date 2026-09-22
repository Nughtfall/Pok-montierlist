import type { Prisma } from "@/generated/prisma/client";

export async function recordAudit(
  tx: Prisma.TransactionClient,
  input: { actorId: string; entityType: string; entityId: string; action: string; summary: string; before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue },
) {
  return tx.changeLog.create({ data: { changedById: input.actorId, entityType: input.entityType, entityId: input.entityId, action: input.action, summary: input.summary, before: input.before, after: input.after } });
}

export async function recordVerification(
  tx: Prisma.TransactionClient,
  input: { actorId: string; entityType: string; entityId: string; sourceId: string; status: "VERIFIED" | "OFFICIAL" | "COMMUNITY" | "UNVERIFIED" | "UNRELEASED" | "UNAVAILABLE"; notes?: string },
) {
  return tx.dataVerification.create({ data: { verifiedById: input.actorId, entityType: input.entityType, entityId: input.entityId, sourceId: input.sourceId, status: input.status, checkedAt: new Date(), notes: input.notes } });
}

export async function syncEntityVerification(tx: Prisma.TransactionClient, entityType: string, entityId: string, status: "VERIFIED" | "OFFICIAL" | "COMMUNITY" | "UNVERIFIED" | "UNRELEASED" | "UNAVAILABLE") {
  // updateMany intentionally treats a historically verified, now-deleted entity
  // as a no-op so administrators can clean up its generic verification record.
  if (entityType === "Pokemon") await tx.pokemon.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "PokemonForm") await tx.pokemonForm.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "Move") await tx.move.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "Ability") await tx.ability.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "Item") await tx.item.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "Regulation") await tx.regulation.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
  else if (entityType === "UsageStatistic") await tx.usageStatistic.updateMany({ where: { id: entityId }, data: { verificationStatus: status } });
}

export async function assertVerifiableEntity(tx: Prisma.TransactionClient, entityType: string, entityId: string) {
  if (entityType === "Pokemon") await tx.pokemon.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "PokemonForm") await tx.pokemonForm.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "Move") await tx.move.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "Ability") await tx.ability.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "Item") await tx.item.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "Regulation") await tx.regulation.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "TierList") await tx.tierList.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "UsageStatistic") await tx.usageStatistic.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "CommunityTierList") await tx.communityTierList.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else if (entityType === "Comment") await tx.comment.findUniqueOrThrow({ where: { id: entityId }, select: { id: true } });
  else throw new Response("Unsupported verification entity", { status: 422 });
}
