import { z } from "zod";

export const adminResources = [
  "pokemon",
  "forms",
  "moves",
  "abilities",
  "items",
  "regulations",
  "tier-lists",
  "statistics",
  "users",
  "sources",
  "verifications",
  "community-lists",
  "comments",
] as const;

export type AdminResource = (typeof adminResources)[number];

const slug = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/);
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const sourceReference = z.object({
  sourceId: z.string().min(1),
  verificationStatus: z.enum(["VERIFIED", "OFFICIAL", "COMMUNITY", "UNVERIFIED", "UNRELEASED", "UNAVAILABLE"]),
  verificationNotes: z.string().trim().max(1000).optional(),
});

const pokemonSchemaBase = sourceReference.extend({
  slug,
  name: z.string().trim().min(1).max(100),
  nationalDexNumber: z.number().int().positive().nullable().optional(),
  artworkUrl: z.url().nullable().optional(),
  primaryType: nullableText(30),
  secondaryType: nullableText(30),
  competitiveRole: nullableText(500),
  strengths: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  weaknesses: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "ANNOUNCED", "UNRELEASED", "UNVERIFIED"]),
  availableAt: z.coerce.date().nullable().optional(),
  availabilityNotes: nullableText(1000),
});
export const pokemonCreateSchema = pokemonSchemaBase;
export const pokemonUpdateSchema = pokemonSchemaBase.partial().required({ sourceId: true, verificationStatus: true });

export const formCreateSchema = sourceReference.extend({
  pokemonId: z.string().min(1),
  slug,
  name: z.string().trim().min(1).max(100),
  primaryType: nullableText(30),
  secondaryType: nullableText(30),
});
export const formUpdateSchema = formCreateSchema.partial().required({ sourceId: true, verificationStatus: true });

const catalogBase = sourceReference.extend({
  slug,
  name: z.string().trim().min(1).max(100),
  effect: nullableText(2000),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "ANNOUNCED", "UNRELEASED", "UNVERIFIED"]),
});
export const moveCreateSchema = catalogBase.extend({
  type: nullableText(30),
  category: z.enum(["PHYSICAL", "SPECIAL", "STATUS"]).nullable().optional(),
  power: z.number().int().min(0).max(10000).nullable().optional(),
  accuracy: z.number().int().min(0).max(100).nullable().optional(),
  priority: z.number().int().min(-20).max(20).default(0),
});
export const abilityCreateSchema = catalogBase;
export const itemCreateSchema = catalogBase;
export const moveUpdateSchema = moveCreateSchema.partial().required({ sourceId: true, verificationStatus: true });
export const abilityUpdateSchema = abilityCreateSchema.partial().required({ sourceId: true, verificationStatus: true });
export const itemUpdateSchema = itemCreateSchema.partial().required({ sourceId: true, verificationStatus: true });

const legalPokemon = z.object({ pokemonId: z.string().min(1), formId: z.string().min(1).nullable().optional(), isLegal: z.boolean(), notes: nullableText(500) });
const legalReference = z.object({ id: z.string().min(1), isLegal: z.boolean() });
function hasDuplicate(values: string[]) { return new Set(values).size !== values.length; }
function validateRegulationReferences(value: { startsAt?: Date | null; endsAt?: Date | null; pokemon?: { pokemonId: string; formId?: string | null }[]; moves?: { id: string }[]; abilities?: { id: string }[]; items?: { id: string }[] }, context: z.RefinementCtx) {
  if (value.startsAt && value.endsAt && value.startsAt > value.endsAt) context.addIssue({ code: "custom", message: "endsAt must not precede startsAt", path: ["endsAt"] });
  if (value.pokemon && hasDuplicate(value.pokemon.map((entry) => `${entry.pokemonId}:${entry.formId ?? "base"}`))) context.addIssue({ code: "custom", message: "Duplicate Pokémon/form legality rows are not allowed", path: ["pokemon"] });
  for (const key of ["moves", "abilities", "items"] as const) if (value[key] && hasDuplicate(value[key].map((entry) => entry.id))) context.addIssue({ code: "custom", message: `Duplicate ${key} legality rows are not allowed`, path: [key] });
}
const regulationSchemaBase = sourceReference.extend({
  slug,
  name: z.string().trim().min(1).max(120),
  format: z.enum(["SINGLES", "DOUBLES"]),
  description: nullableText(2000),
  restrictions: nullableText(4000),
  teamSizeLimit: z.number().int().positive().max(24).nullable().optional(),
  moveLimit: z.number().int().positive().max(16).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  pokemon: z.array(legalPokemon).max(2000).default([]),
  moves: z.array(legalReference).max(2000).default([]),
  abilities: z.array(legalReference).max(2000).default([]),
  items: z.array(legalReference).max(2000).default([]),
});
export const regulationCreateSchema = regulationSchemaBase.superRefine(validateRegulationReferences);
export const regulationUpdateSchema = regulationSchemaBase.partial().required({ sourceId: true, verificationStatus: true }).superRefine(validateRegulationReferences);

const tierEntry = z.object({
  pokemonId: z.string().min(1),
  tier: z.enum(["S_PLUS", "S", "A_PLUS", "A", "B_PLUS", "B", "C", "D", "UNTIERED"]),
  explanation: nullableText(1000),
});
const tierListSchemaBase = sourceReference.extend({
  regulationId: z.string().min(1),
  format: z.enum(["SINGLES", "DOUBLES"]),
  name: z.string().trim().min(1).max(120),
  publishedAt: z.coerce.date().nullable().optional(),
  entries: z.array(tierEntry).max(1000),
});
export const tierListCreateSchema = tierListSchemaBase.refine((value) => new Set(value.entries.map((entry) => entry.pokemonId)).size === value.entries.length, { message: "Duplicate Pokémon are not allowed", path: ["entries"] });
export const tierListUpdateSchema = tierListSchemaBase.partial().required({ sourceId: true, verificationStatus: true }).refine((value) => !value.entries || new Set(value.entries.map((entry) => entry.pokemonId)).size === value.entries.length, { message: "Duplicate Pokémon are not allowed", path: ["entries"] });

const statisticSchemaBase = sourceReference.extend({
  pokemonId: z.string().min(1),
  regulationId: z.string().min(1),
  format: z.enum(["SINGLES", "DOUBLES"]),
  sampleSize: z.number().int().nonnegative().nullable().optional(),
  usageRate: z.number().min(0).max(100).nullable().optional(),
  winRate: z.number().min(0).max(100).nullable().optional(),
  recordedAt: z.coerce.date(),
});
export const statisticCreateSchema = statisticSchemaBase.refine((value) => value.usageRate == null || value.sampleSize != null, { message: "A sample size is required for usage rates", path: ["sampleSize"] });
export const statisticUpdateSchema = statisticSchemaBase.partial().required({ sourceId: true, verificationStatus: true }).refine((value) => value.usageRate == null || value.sampleSize != null, { message: "A sample size is required for usage rates", path: ["sampleSize"] });

export const userCreateSchema = z.object({
  name: nullableText(80),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).nullable().optional(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).default("USER"),
  status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),
});
export const userUpdateSchema = userCreateSchema.omit({ password: true }).partial().extend({ password: z.string().min(12).max(128).optional() });

export const sourceCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  url: z.url(),
  publisher: nullableText(150),
  isOfficial: z.boolean().default(false),
  accessedAt: z.coerce.date().nullable().optional(),
  notes: nullableText(1000),
});
export const sourceUpdateSchema = sourceCreateSchema.partial();

export const verificationCreateSchema = z.object({
  entityType: z.enum(["Pokemon", "PokemonForm", "Move", "Ability", "Item", "Regulation", "TierList", "UsageStatistic", "CommunityTierList", "Comment"]),
  entityId: z.string().min(1),
  sourceId: z.string().min(1),
  status: z.enum(["VERIFIED", "OFFICIAL", "COMMUNITY", "UNVERIFIED", "UNRELEASED", "UNAVAILABLE"]),
  checkedAt: z.coerce.date().nullable().optional(),
  notes: nullableText(1000),
});
export const verificationUpdateSchema = verificationCreateSchema.partial();

export const moderationUpdateSchema = z.object({
  moderationStatus: z.enum(["PUBLISHED", "HIDDEN", "REMOVED"]),
  reason: z.string().trim().min(3).max(1000),
});

export function schemaFor(resource: AdminResource, mode: "create" | "update") {
  const schemas = {
    pokemon: [pokemonCreateSchema, pokemonUpdateSchema],
    forms: [formCreateSchema, formUpdateSchema],
    moves: [moveCreateSchema, moveUpdateSchema],
    abilities: [abilityCreateSchema, abilityUpdateSchema],
    items: [itemCreateSchema, itemUpdateSchema],
    regulations: [regulationCreateSchema, regulationUpdateSchema],
    "tier-lists": [tierListCreateSchema, tierListUpdateSchema],
    statistics: [statisticCreateSchema, statisticUpdateSchema],
    users: [userCreateSchema, userUpdateSchema],
    sources: [sourceCreateSchema, sourceUpdateSchema],
    verifications: [verificationCreateSchema, verificationUpdateSchema],
    "community-lists": [moderationUpdateSchema, moderationUpdateSchema],
    comments: [moderationUpdateSchema, moderationUpdateSchema],
  } as const;
  return schemas[resource][mode === "create" ? 0 : 1];
}
