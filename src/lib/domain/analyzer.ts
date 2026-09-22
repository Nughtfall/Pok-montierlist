export type AnalyzablePokemon = {
  name: string;
  types: string[];
  moveTypes: string[];
  verifiedTags: string[];
};

export type TeamAnalysis = {
  defensiveTypes: Record<string, number>;
  offensiveCoverage: string[];
  capabilities: string[];
  limitations: string[];
};

export function analyzeVerifiedTeam(team: AnalyzablePokemon[]): TeamAnalysis {
  const defensiveTypes: Record<string, number> = {};
  const moveTypes = new Set<string>();
  const capabilities = new Set<string>();

  for (const pokemon of team) {
    for (const type of pokemon.types) defensiveTypes[type] = (defensiveTypes[type] ?? 0) + 1;
    for (const type of pokemon.moveTypes) moveTypes.add(type);
    for (const tag of pokemon.verifiedTags) capabilities.add(tag);
  }

  const limitations = [];
  if (team.length === 0) limitations.push("Add verified team members to begin analysis.");
  if (moveTypes.size === 0) limitations.push("Offensive coverage is unavailable until verified moves are selected.");
  if (capabilities.size === 0) limitations.push("Team roles are unavailable until verified capability tags exist.");

  return {
    defensiveTypes,
    offensiveCoverage: [...moveTypes].sort(),
    capabilities: [...capabilities].sort(),
    limitations,
  };
}
