import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

export const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
});

export const teamPokemonSchema = z.object({
  pokemonId: z.string().min(1),
  formId: z.string().min(1).nullable().optional(),
  abilityId: z.string().min(1).nullable().optional(),
  itemId: z.string().min(1).nullable().optional(),
  moveIds: z.array(z.string().min(1)).max(16).default([]),
  notes: z.string().max(500).optional(),
});

export const teamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  regulationId: z.string().min(1),
  format: z.enum(["SINGLES", "DOUBLES"]),
  isPublic: z.boolean().default(false),
  pokemon: z.array(teamPokemonSchema).max(24),
});

export const adminPokemonSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(100),
  nationalDexNumber: z.number().int().positive().nullable().optional(),
  primaryType: z.string().trim().max(30).nullable().optional(),
  secondaryType: z.string().trim().max(30).nullable().optional(),
  availability: z.enum([
    "AVAILABLE",
    "UNAVAILABLE",
    "ANNOUNCED",
    "UNRELEASED",
    "UNVERIFIED",
  ]),
  verificationStatus: z.enum([
    "VERIFIED",
    "OFFICIAL",
    "COMMUNITY",
    "UNVERIFIED",
    "UNRELEASED",
    "UNAVAILABLE",
  ]),
  sourceUrl: z.url(),
  sourceName: z.string().trim().min(1).max(150),
  notes: z.string().max(1000).optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().min(2).max(80),
});

export const communityTierListSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
  regulationId: z.string().min(1),
  format: z.enum(["SINGLES", "DOUBLES"]),
  entries: z.array(z.object({
    pokemonId: z.string().min(1),
    tier: z.enum(["S_PLUS", "S", "A_PLUS", "A", "B_PLUS", "B", "C", "D", "UNTIERED"]),
    explanation: z.string().max(500).optional(),
  })).max(500),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().min(1).nullable().optional(),
});
