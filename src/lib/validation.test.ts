import { describe, expect, it } from "vitest";
import { adminPokemonSchema, credentialsSchema, profileSchema, teamSchema } from "./validation";

describe("security validation", () => {
  it("requires strong password length and valid email", () => {
    expect(credentialsSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "trainer@example.com", password: "long-enough-password" }).success).toBe(true);
  });

  it("rejects payloads beyond the API safety cap before regulation validation", () => {
    const pokemon = Array.from({ length: 25 }, (_, index) => ({ pokemonId: `p${index}`, moveIds: [] }));
    expect(teamSchema.safeParse({ name: "Team", regulationId: "reg", format: "SINGLES", isPublic: false, pokemon }).success).toBe(false);
  });

  it("requires a source for admin Pokémon ingestion", () => {
    expect(adminPokemonSchema.safeParse({ slug: "entry", name: "Entry", availability: "AVAILABLE", verificationStatus: "OFFICIAL" }).success).toBe(false);
  });

  it("accepts safe profile names and rejects URL-like usernames", () => {
    expect(profileSchema.safeParse({ name: "Champion Trainer", username: "trainer_01" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "Champion Trainer", username: "../admin" }).success).toBe(false);
  });
});
