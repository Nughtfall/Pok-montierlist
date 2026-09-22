import { describe, expect, it } from "vitest";
import { validateTeamLegality, type LegalityContext, type TeamSelection } from "./legality";

const baseTeam: TeamSelection[] = [{ pokemonId: "p1", formId: null, abilityId: "a1", itemId: "i1", moveIds: ["m1"] }];
const context: LegalityContext = {
  teamSize: 6,
  moveLimit: 4,
  availablePokemonIds: new Set(["p1"]),
  legalPokemon: new Map([["p1", new Set([null])]]),
  learnedMoveKeys: new Set(["p1:m1"]),
  learnedAbilityKeys: new Set(["p1:a1"]),
  associatedItemKeys: new Set(["p1:i1"]),
  legalMoveIds: new Set(["m1"]),
  legalAbilityIds: new Set(["a1"]),
  legalItemIds: new Set(["i1"]),
};

describe("validateTeamLegality", () => {
  it("accepts a fully verified, regulation-legal team", () => {
    expect(validateTeamLegality(baseTeam, context)).toEqual([]);
  });

  it.each(["UNAVAILABLE", "UNRELEASED", "UNVERIFIED"])("rejects %s Pokémon from the playable roster", () => {
    const unavailable = { ...context, availablePokemonIds: new Set<string>() };
    expect(validateTeamLegality(baseTeam, unavailable)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "CHAMPIONS_UNAVAILABLE" })]));
  });

  it("keeps Champions availability separate from regulation legality", () => {
    const illegal = { ...context, legalPokemon: new Map<string, Set<string | null>>() };
    const issues = validateTeamLegality(baseTeam, illegal);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "REGULATION_POKEMON" })]));
    expect(issues).not.toEqual(expect.arrayContaining([expect.objectContaining({ code: "CHAMPIONS_UNAVAILABLE" })]));
  });

  it("rejects unverified or regulation-illegal moves, abilities, and items", () => {
    const broken: TeamSelection[] = [{ pokemonId: "p1", abilityId: "a2", itemId: "i2", moveIds: ["m2"] }];
    const codes = validateTeamLegality(broken, context).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["MOVE_NOT_LEARNED", "ABILITY_NOT_LEARNED", "ITEM_NOT_VERIFIED"]));
  });

  it("rejects duplicate Pokémon and moves", () => {
    const duplicated = [{ ...baseTeam[0], moveIds: ["m1", "m1"] }, baseTeam[0]];
    const codes = validateTeamLegality(duplicated, context).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["DUPLICATE_POKEMON", "DUPLICATE_MOVE"]));
  });

  it("uses the sourced regulation move limit", () => {
    const restrictive = { ...context, moveLimit: 1, learnedMoveKeys: new Set(["p1:m1", "p1:m2"]), legalMoveIds: new Set(["m1", "m2"]) };
    const issues = validateTeamLegality([{ ...baseTeam[0], moveIds: ["m1", "m2"] }], restrictive);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MOVE_LIMIT" })]));
  });
});
