import { randomBytes } from "node:crypto";
import { db } from "@/lib/prisma";
import { teamSchema } from "@/lib/validation";
import { validateTeamLegality, type LegalityContext } from "@/lib/domain/legality";

export class TeamValidationError extends Error {
  constructor(public issues: ReturnType<typeof validateTeamLegality>) {
    super("Team is not legal for the selected regulation");
  }
}

async function legalityContext(regulationId: string, teamSize: number, moveLimit: number): Promise<LegalityContext> {
  const client = db();
  const [available, pokemon, moves, abilities, items, learnedMoves, learnedAbilities, associatedItems] =
    await Promise.all([
      client.championsAvailability.findMany({ where: { status: "AVAILABLE" }, select: { pokemonId: true } }),
      client.regulationPokemon.findMany({ where: { regulationId, isLegal: true }, select: { pokemonId: true, formId: true } }),
      client.regulationMove.findMany({ where: { regulationId, isLegal: true }, select: { moveId: true } }),
      client.regulationAbility.findMany({ where: { regulationId, isLegal: true }, select: { abilityId: true } }),
      client.regulationItem.findMany({ where: { regulationId, isLegal: true }, select: { itemId: true } }),
      client.pokemonMove.findMany({ where: { isVerified: true }, select: { pokemonId: true, moveId: true } }),
      client.pokemonAbility.findMany({ where: { isVerified: true }, select: { pokemonId: true, abilityId: true } }),
      client.pokemonItem.findMany({ where: { isVerified: true }, select: { pokemonId: true, itemId: true } }),
    ]);

  const legalPokemon = new Map<string, Set<string | null>>();
  for (const entry of pokemon) {
    const forms = legalPokemon.get(entry.pokemonId) ?? new Set<string | null>();
    forms.add(entry.formId);
    legalPokemon.set(entry.pokemonId, forms);
  }

  return {
    teamSize,
    moveLimit,
    availablePokemonIds: new Set(available.map((entry) => entry.pokemonId)),
    legalPokemon,
    learnedMoveKeys: new Set(learnedMoves.map((entry) => `${entry.pokemonId}:${entry.moveId}`)),
    learnedAbilityKeys: new Set(learnedAbilities.map((entry) => `${entry.pokemonId}:${entry.abilityId}`)),
    associatedItemKeys: new Set(associatedItems.map((entry) => `${entry.pokemonId}:${entry.itemId}`)),
    legalMoveIds: new Set(moves.map((entry) => entry.moveId)),
    legalAbilityIds: new Set(abilities.map((entry) => entry.abilityId)),
    legalItemIds: new Set(items.map((entry) => entry.itemId)),
  };
}

export async function createTeam(ownerId: string, input: unknown) {
  const parsed = teamSchema.parse(input);
  const regulation = await db().regulation.findUnique({ where: { id: parsed.regulationId } });
  if (!regulation || regulation.format !== parsed.format || !["VERIFIED", "OFFICIAL"].includes(regulation.verificationStatus)) {
    throw new TeamValidationError([{ path: "regulationId", code: "REGULATION", message: "Select a verified regulation matching the team format." }]);
  }
  if (!regulation.teamSizeLimit || !regulation.moveLimit) {
    throw new TeamValidationError([{ path: "regulationId", code: "UNVERIFIED_LIMITS", message: "Team-size and move-count rules have not been verified for this regulation." }]);
  }
  const issues = validateTeamLegality(parsed.pokemon, await legalityContext(parsed.regulationId, regulation.teamSizeLimit, regulation.moveLimit));
  if (issues.length) throw new TeamValidationError(issues);

  return db().team.create({
    data: {
      ownerId,
      regulationId: parsed.regulationId,
      name: parsed.name,
      format: parsed.format,
      isPublic: parsed.isPublic,
      shareSlug: parsed.isPublic ? randomBytes(10).toString("hex") : null,
      pokemon: {
        create: parsed.pokemon.map((slot, position) => ({
          pokemonId: slot.pokemonId,
          formId: slot.formId,
          abilityId: slot.abilityId,
          itemId: slot.itemId,
          position,
          notes: slot.notes,
          moves: { create: slot.moveIds.map((moveId, movePosition) => ({ moveId, position: movePosition })) },
        })),
      },
    },
    include: { pokemon: { include: { moves: true } } },
  });
}

export async function updateTeam(ownerId: string, teamId: string, input: unknown) {
  const parsed = teamSchema.parse(input);
  const [current, regulation] = await Promise.all([
    db().team.findFirst({ where: { id: teamId, ownerId }, select: { id: true, shareSlug: true } }),
    db().regulation.findUnique({ where: { id: parsed.regulationId } }),
  ]);
  if (!current) throw new Error("Team not found");
  if (!regulation || regulation.format !== parsed.format || !["VERIFIED", "OFFICIAL"].includes(regulation.verificationStatus)) {
    throw new TeamValidationError([{ path: "regulationId", code: "REGULATION", message: "Select a verified regulation matching the team format." }]);
  }
  if (!regulation.teamSizeLimit || !regulation.moveLimit) {
    throw new TeamValidationError([{ path: "regulationId", code: "UNVERIFIED_LIMITS", message: "Team-size and move-count rules have not been verified for this regulation." }]);
  }
  const issues = validateTeamLegality(parsed.pokemon, await legalityContext(parsed.regulationId, regulation.teamSizeLimit, regulation.moveLimit));
  if (issues.length) throw new TeamValidationError(issues);

  return db().$transaction(async (tx) => {
    await tx.teamPokemon.deleteMany({ where: { teamId } });
    return tx.team.update({
      where: { id: teamId },
      data: {
        regulationId: parsed.regulationId,
        name: parsed.name,
        format: parsed.format,
        isPublic: parsed.isPublic,
        shareSlug: parsed.isPublic ? current.shareSlug ?? randomBytes(10).toString("hex") : null,
        pokemon: { create: parsed.pokemon.map((slot, position) => ({
          pokemonId: slot.pokemonId, formId: slot.formId, abilityId: slot.abilityId, itemId: slot.itemId,
          position, notes: slot.notes,
          moves: { create: slot.moveIds.map((moveId, movePosition) => ({ moveId, position: movePosition })) },
        })) },
      },
      include: { pokemon: { include: { moves: true } } },
    });
  });
}

export async function duplicateTeam(ownerId: string, teamId: string) {
  const source = await db().team.findFirst({
    where: { id: teamId, OR: [{ ownerId }, { isPublic: true }] },
    include: { pokemon: { orderBy: { position: "asc" }, include: { moves: { orderBy: { position: "asc" } } } } },
  });
  if (!source) throw new Error("Team not found");
  return createTeam(ownerId, {
    name: `${source.name} copy`,
    regulationId: source.regulationId,
    format: source.format,
    isPublic: false,
    pokemon: source.pokemon.map((slot) => ({
      pokemonId: slot.pokemonId,
      formId: slot.formId,
      abilityId: slot.abilityId,
      itemId: slot.itemId,
      notes: slot.notes ?? undefined,
      moveIds: slot.moves.map((move) => move.moveId),
    })),
  });
}
