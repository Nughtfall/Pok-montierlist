import { describe, expect, it } from "vitest";
import { analyzeVerifiedTeam } from "./analyzer";

describe("analyzeVerifiedTeam", () => {
  it("only reports provided verified types, moves, and capability tags", () => {
    expect(analyzeVerifiedTeam([{ name: "Verified entry", types: ["Water"], moveTypes: ["Ice", "Water"], verifiedTags: ["Speed control"] }])).toEqual({
      defensiveTypes: { Water: 1 },
      offensiveCoverage: ["Ice", "Water"],
      capabilities: ["Speed control"],
      limitations: [],
    });
  });

  it("reports unavailable analysis instead of fabricating it", () => {
    const result = analyzeVerifiedTeam([{ name: "Incomplete", types: [], moveTypes: [], verifiedTags: [] }]);
    expect(result.offensiveCoverage).toEqual([]);
    expect(result.capabilities).toEqual([]);
    expect(result.limitations).toHaveLength(2);
  });
});
