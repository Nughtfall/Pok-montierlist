import { describe, expect, it } from "vitest";
import { moderationUpdateSchema, moveCreateSchema, pokemonCreateSchema, regulationCreateSchema, statisticCreateSchema, tierListCreateSchema } from "@/lib/admin-validation";

const source = { sourceId: "source-1", verificationStatus: "OFFICIAL" as const, verificationNotes: "Checked against the linked publication" };

describe("admin operation validation", () => {
  it("requires a source for competitive catalog records", () => {
    const result = moveCreateSchema.safeParse({ slug: "move", name: "Move", availability: "UNVERIFIED" });
    expect(result.success).toBe(false);
  });

  it("keeps Champions availability explicit for sourced Pokémon records", () => {
    expect(pokemonCreateSchema.safeParse({ ...source, slug: "confirmed", name: "Confirmed" }).success).toBe(false);
    expect(pokemonCreateSchema.safeParse({ ...source, slug: "confirmed", name: "Confirmed", availability: "AVAILABLE" }).success).toBe(true);
  });

  it("rejects duplicate official tier entries", () => {
    const result = tierListCreateSchema.safeParse({ ...source, regulationId: "regulation", format: "SINGLES", name: "Official", entries: [
      { pokemonId: "pokemon", tier: "S" }, { pokemonId: "pokemon", tier: "A" },
    ] });
    expect(result.success).toBe(false);
  });

  it("requires sample sizes whenever usage rates are recorded", () => {
    const result = statisticCreateSchema.safeParse({ ...source, pokemonId: "pokemon", regulationId: "regulation", format: "DOUBLES", usageRate: 12.5, recordedAt: new Date().toISOString() });
    expect(result.success).toBe(false);
  });

  it("rejects invalid regulation date ranges", () => {
    const result = regulationCreateSchema.safeParse({ ...source, slug: "reg-a", name: "Reg A", format: "SINGLES", startsAt: "2026-10-02", endsAt: "2026-10-01", pokemon: [], moves: [], abilities: [], items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate regulation legality rows", () => {
    const result = regulationCreateSchema.safeParse({ ...source, slug: "reg-a", name: "Reg A", format: "SINGLES", pokemon: [], moves: [{ id: "move", isLegal: true }, { id: "move", isLegal: false }], abilities: [], items: [] });
    expect(result.success).toBe(false);
  });

  it("requires a reason for moderation changes", () => {
    expect(moderationUpdateSchema.safeParse({ moderationStatus: "HIDDEN", reason: "" }).success).toBe(false);
    expect(moderationUpdateSchema.safeParse({ moderationStatus: "HIDDEN", reason: "Unverified claim" }).success).toBe(true);
  });
});
