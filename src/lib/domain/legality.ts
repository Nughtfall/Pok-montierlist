export type TeamSelection = {
  pokemonId: string;
  formId?: string | null;
  abilityId?: string | null;
  itemId?: string | null;
  moveIds: string[];
};

export type LegalityContext = {
  teamSize: number;
  moveLimit: number;
  availablePokemonIds: ReadonlySet<string>;
  legalPokemon: ReadonlyMap<string, ReadonlySet<string | null>>;
  learnedMoveKeys: ReadonlySet<string>;
  learnedAbilityKeys: ReadonlySet<string>;
  associatedItemKeys: ReadonlySet<string>;
  legalMoveIds: ReadonlySet<string>;
  legalAbilityIds: ReadonlySet<string>;
  legalItemIds: ReadonlySet<string>;
};

export type LegalityIssue = {
  path: string;
  code: string;
  message: string;
};

const pair = (pokemonId: string, valueId: string) => `${pokemonId}:${valueId}`;

export function validateTeamLegality(
  team: TeamSelection[],
  context: LegalityContext,
): LegalityIssue[] {
  const issues: LegalityIssue[] = [];

  if (team.length > context.teamSize) {
    issues.push({
      path: "pokemon",
      code: "TEAM_SIZE",
      message: `This regulation allows at most ${context.teamSize} team members.`,
    });
  }

  const seen = new Set<string>();
  team.forEach((slot, index) => {
    const path = `pokemon.${index}`;
    if (seen.has(slot.pokemonId)) {
      issues.push({ path, code: "DUPLICATE_POKEMON", message: "Duplicate Pokémon are not allowed." });
    }
    seen.add(slot.pokemonId);

    if (!context.availablePokemonIds.has(slot.pokemonId)) {
      issues.push({
        path,
        code: "CHAMPIONS_UNAVAILABLE",
        message: "This Pokémon is not verified as AVAILABLE in Pokémon Champions.",
      });
    }

    const legalForms = context.legalPokemon.get(slot.pokemonId);
    if (!legalForms || !legalForms.has(slot.formId ?? null)) {
      issues.push({
        path,
        code: "REGULATION_POKEMON",
        message: "This Pokémon or form is not legal in the selected regulation.",
      });
    }

    if (new Set(slot.moveIds).size !== slot.moveIds.length) {
      issues.push({ path: `${path}.moveIds`, code: "DUPLICATE_MOVE", message: "A move can only be selected once." });
    }

    if (slot.moveIds.length > context.moveLimit) {
      issues.push({ path: `${path}.moveIds`, code: "MOVE_LIMIT", message: `This regulation allows at most ${context.moveLimit} moves per Pokémon.` });
    }

    for (const moveId of slot.moveIds) {
      if (!context.learnedMoveKeys.has(pair(slot.pokemonId, moveId))) {
        issues.push({ path: `${path}.moveIds`, code: "MOVE_NOT_LEARNED", message: "The move is not verified for this Pokémon." });
      } else if (!context.legalMoveIds.has(moveId)) {
        issues.push({ path: `${path}.moveIds`, code: "REGULATION_MOVE", message: "The move is illegal in this regulation." });
      }
    }

    if (slot.abilityId) {
      if (!context.learnedAbilityKeys.has(pair(slot.pokemonId, slot.abilityId))) {
        issues.push({ path: `${path}.abilityId`, code: "ABILITY_NOT_LEARNED", message: "The ability is not verified for this Pokémon." });
      } else if (!context.legalAbilityIds.has(slot.abilityId)) {
        issues.push({ path: `${path}.abilityId`, code: "REGULATION_ABILITY", message: "The ability is illegal in this regulation." });
      }
    }

    if (slot.itemId) {
      if (!context.associatedItemKeys.has(pair(slot.pokemonId, slot.itemId))) {
        issues.push({ path: `${path}.itemId`, code: "ITEM_NOT_VERIFIED", message: "The item is not verified for this Pokémon." });
      } else if (!context.legalItemIds.has(slot.itemId)) {
        issues.push({ path: `${path}.itemId`, code: "REGULATION_ITEM", message: "The item is illegal in this regulation." });
      }
    }
  });

  return issues;
}
