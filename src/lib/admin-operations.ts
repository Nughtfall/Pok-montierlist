import { hash } from "bcryptjs";
import { db } from "@/lib/prisma";
import { assertVerifiableEntity, recordAudit, recordVerification, syncEntityVerification } from "@/lib/admin-audit";
import {
  abilityCreateSchema, abilityUpdateSchema, formCreateSchema, formUpdateSchema, itemCreateSchema, itemUpdateSchema,
  moderationUpdateSchema, moveCreateSchema, moveUpdateSchema, regulationCreateSchema, regulationUpdateSchema,
  pokemonCreateSchema, pokemonUpdateSchema,
  sourceCreateSchema, sourceUpdateSchema, statisticCreateSchema, statisticUpdateSchema, tierListCreateSchema,
  tierListUpdateSchema, userCreateSchema, userUpdateSchema, verificationCreateSchema, verificationUpdateSchema,
  type AdminResource,
} from "@/lib/admin-validation";
import type { Prisma } from "@/generated/prisma/client";

type Result = { ok: true; data: unknown } | { ok: false; issues: unknown };
const invalid = (issues: unknown): Result => ({ ok: false, issues });
const valid = (data: unknown): Result => ({ ok: true, data });

export async function listAdminResource(resource: AdminResource) {
  switch (resource) {
    case "pokemon": return db().pokemon.findMany({ take: 300, orderBy: { name: "asc" }, include: { availability: true, _count: { select: { forms: true, regulations: true, moves: true, abilities: true, items: true } } } });
    case "forms": return db().pokemonForm.findMany({ take: 200, orderBy: { name: "asc" }, include: { pokemon: { select: { name: true } } } });
    case "moves": return db().move.findMany({ take: 200, orderBy: { name: "asc" } });
    case "abilities": return db().ability.findMany({ take: 200, orderBy: { name: "asc" } });
    case "items": return db().item.findMany({ take: 200, orderBy: { name: "asc" } });
    case "regulations": return db().regulation.findMany({ take: 200, orderBy: { updatedAt: "desc" }, include: { _count: { select: { pokemon: true, moves: true, abilities: true, items: true } } } });
    case "tier-lists": return db().tierList.findMany({ take: 100, orderBy: { updatedAt: "desc" }, include: { regulation: { select: { name: true } }, entries: { orderBy: { ranking: "asc" }, include: { pokemon: { select: { name: true } } } } } });
    case "statistics": return db().usageStatistic.findMany({ take: 200, orderBy: { recordedAt: "desc" }, include: { pokemon: { select: { name: true } }, regulation: { select: { name: true } } } });
    case "users": return db().user.findMany({ take: 200, orderBy: { createdAt: "desc" }, select: { id: true, name: true, username: true, email: true, role: true, status: true, createdAt: true, updatedAt: true } });
    case "sources": return db().dataSource.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { _count: { select: { verifications: true } } } });
    case "verifications": return db().dataVerification.findMany({ take: 200, orderBy: { updatedAt: "desc" }, include: { source: { select: { name: true, url: true } }, verifiedBy: { select: { name: true, email: true } } } });
    case "community-lists": return db().communityTierList.findMany({ take: 200, orderBy: { updatedAt: "desc" }, include: { author: { select: { name: true, email: true } }, _count: { select: { entries: true, votes: true, comments: true } } } });
    case "comments": return db().comment.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } }, tierList: { select: { title: true } } } });
  }
}

async function createPokemon(body: unknown, actorId: string): Promise<Result> {
  const parsed = pokemonCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, availability, availableAt, availabilityNotes, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    const record = await tx.pokemon.create({
      data: {
        ...data,
        verificationStatus,
        availability: { create: { status: availability, availableAt, checkedAt: new Date(), notes: availabilityNotes } },
      },
      include: { availability: true },
    });
    await recordVerification(tx, { actorId, entityType: "Pokemon", entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "Pokemon", entityId: record.id, action: "CREATE", summary: `Created Pokémon ${record.name}`, after: { slug: record.slug, availability, verificationStatus } });
    return record;
  });
  return valid(created);
}

async function ensureRankable(tx: Prisma.TransactionClient, regulationId: string, format: "SINGLES" | "DOUBLES", pokemonIds: string[]) {
  const regulation = await tx.regulation.findFirst({ where: { id: regulationId, format, verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, select: { id: true } });
  if (!regulation) throw new Response("Verified matching regulation required", { status: 422 });
  if (!pokemonIds.length) return;
  const available = await tx.championsAvailability.count({ where: { pokemonId: { in: pokemonIds }, status: "AVAILABLE" } });
  const legal = await tx.regulationPokemon.findMany({ where: { regulationId, pokemonId: { in: pokemonIds }, isLegal: true }, distinct: ["pokemonId"], select: { pokemonId: true } });
  if (available !== pokemonIds.length || legal.length !== pokemonIds.length) throw new Response("Every ranked Pokémon must be AVAILABLE and explicitly legal", { status: 422 });
}

async function ensureFormOwnership(tx: Prisma.TransactionClient, pokemon: { pokemonId: string; formId?: string | null }[]) {
  const pairs = pokemon.filter((entry): entry is { pokemonId: string; formId: string } => Boolean(entry.formId));
  if (!pairs.length) return;
  const matches = await tx.pokemonForm.count({ where: { OR: pairs.map((entry) => ({ id: entry.formId, pokemonId: entry.pokemonId })) } });
  if (matches !== pairs.length) throw new Response("Each legal form must belong to its selected Pokémon", { status: 422 });
}

async function createForm(body: unknown, actorId: string): Promise<Result> {
  const parsed = formCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    const record = await tx.pokemonForm.create({ data: { ...data, verificationStatus } });
    await recordVerification(tx, { actorId, entityType: "PokemonForm", entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "PokemonForm", entityId: record.id, action: "CREATE", summary: `Created form ${record.name}`, after: { pokemonId: record.pokemonId, slug: record.slug, verificationStatus } });
    return record;
  });
  return valid(created);
}

async function createCatalog(resource: "moves" | "abilities" | "items", body: unknown, actorId: string): Promise<Result> {
  const schema = resource === "moves" ? moveCreateSchema : resource === "abilities" ? abilityCreateSchema : itemCreateSchema;
  const parsed = schema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    const record = resource === "moves"
      ? await tx.move.create({ data: { ...data, verificationStatus } })
      : resource === "abilities"
        ? await tx.ability.create({ data: { ...data, verificationStatus } })
        : await tx.item.create({ data: { ...data, verificationStatus } });
    const entityType = resource === "moves" ? "Move" : resource === "abilities" ? "Ability" : "Item";
    await recordVerification(tx, { actorId, entityType, entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType, entityId: record.id, action: "CREATE", summary: `Created ${entityType.toLowerCase()} ${record.name}`, after: { slug: record.slug, availability: record.availability, verificationStatus } });
    return record;
  });
  return valid(created);
}

async function createRegulation(body: unknown, actorId: string): Promise<Result> {
  const parsed = regulationCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, pokemon, moves, abilities, items, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    await ensureFormOwnership(tx, pokemon);
    const replacedCurrent = data.isCurrent ? await tx.regulation.findMany({ where: { format: data.format, isCurrent: true }, select: { id: true, name: true } }) : [];
    if (replacedCurrent.length) await tx.regulation.updateMany({ where: { id: { in: replacedCurrent.map((entry) => entry.id) } }, data: { isCurrent: false } });
    const record = await tx.regulation.create({ data: {
      ...data, verificationStatus,
      pokemon: { create: pokemon.map((entry) => ({ ...entry, formId: entry.formId || null })) },
      moves: { create: moves.map((entry) => ({ moveId: entry.id, isLegal: entry.isLegal })) },
      abilities: { create: abilities.map((entry) => ({ abilityId: entry.id, isLegal: entry.isLegal })) },
      items: { create: items.map((entry) => ({ itemId: entry.id, isLegal: entry.isLegal })) },
    } });
    await recordVerification(tx, { actorId, entityType: "Regulation", entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    for (const previous of replacedCurrent) await recordAudit(tx, { actorId, entityType: "Regulation", entityId: previous.id, action: "UPDATE", summary: `Replaced current regulation ${previous.name}`, before: { isCurrent: true }, after: { isCurrent: false } });
    await recordAudit(tx, { actorId, entityType: "Regulation", entityId: record.id, action: "CREATE", summary: `Created regulation ${record.name}`, after: { slug: record.slug, format: record.format, verificationStatus } });
    return record;
  });
  return valid(created);
}

async function createTierList(body: unknown, actorId: string): Promise<Result> {
  const parsed = tierListCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, entries, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    await ensureRankable(tx, data.regulationId, data.format, entries.map((entry) => entry.pokemonId));
    const record = await tx.tierList.create({ data: { ...data, entries: { create: entries.map((entry, ranking) => ({ ...entry, ranking })) } }, include: { entries: true } });
    if (entries.length) await tx.tierHistory.createMany({ data: entries.map((entry, ranking) => ({ pokemonId: entry.pokemonId, regulationId: data.regulationId, format: data.format, previousTier: null, newTier: entry.tier, ranking, explanation: entry.explanation })) });
    await recordVerification(tx, { actorId, entityType: "TierList", entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "TierList", entityId: record.id, action: "CREATE", summary: `Created official tier list ${record.name}`, after: { regulationId: record.regulationId, format: record.format, entries: entries.length } });
    return record;
  });
  return valid(created);
}

async function createStatistic(body: unknown, actorId: string): Promise<Result> {
  const parsed = statisticCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
  const created = await db().$transaction(async (tx) => {
    const regulation = await tx.regulation.findFirst({ where: { id: data.regulationId, format: data.format }, select: { id: true } });
    if (!regulation) throw new Response("Statistic format must match its regulation", { status: 422 });
    const record = await tx.usageStatistic.create({ data: { ...data, verificationStatus } });
    await recordVerification(tx, { actorId, entityType: "UsageStatistic", entityId: record.id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "UsageStatistic", entityId: record.id, action: "CREATE", summary: "Created sourced usage statistic", after: { pokemonId: record.pokemonId, regulationId: record.regulationId, verificationStatus } });
    return record;
  });
  return valid(created);
}

export async function createAdminResource(resource: AdminResource, body: unknown, actorId: string): Promise<Result> {
  if (resource === "pokemon") return createPokemon(body, actorId);
  if (resource === "forms") return createForm(body, actorId);
  if (resource === "moves" || resource === "abilities" || resource === "items") return createCatalog(resource, body, actorId);
  if (resource === "regulations") return createRegulation(body, actorId);
  if (resource === "tier-lists") return createTierList(body, actorId);
  if (resource === "statistics") return createStatistic(body, actorId);
  if (resource === "users") {
    const parsed = userCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const { password, ...data } = parsed.data;
    const record = await db().$transaction(async (tx) => {
      const created = await tx.user.create({ data: { ...data, passwordHash: await hash(password, 12) }, select: { id: true, name: true, username: true, email: true, role: true, status: true } });
      await recordAudit(tx, { actorId, entityType: "User", entityId: created.id, action: "CREATE", summary: `Created user ${created.email}`, after: { role: created.role, status: created.status } });
      return created;
    });
    return valid(record);
  }
  if (resource === "sources") {
    const parsed = sourceCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const record = await db().$transaction(async (tx) => {
      const created = await tx.dataSource.create({ data: parsed.data });
      await recordAudit(tx, { actorId, entityType: "DataSource", entityId: created.id, action: "CREATE", summary: `Created source ${created.name}`, after: { url: created.url, isOfficial: created.isOfficial } });
      return created;
    });
    return valid(record);
  }
  if (resource === "verifications") {
    const parsed = verificationCreateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const record = await db().$transaction(async (tx) => {
      await assertVerifiableEntity(tx, parsed.data.entityType, parsed.data.entityId);
      const created = await tx.dataVerification.create({ data: { ...parsed.data, verifiedById: actorId } });
      await syncEntityVerification(tx, created.entityType, created.entityId, created.status);
      await recordAudit(tx, { actorId, entityType: "DataVerification", entityId: created.id, action: "CREATE", summary: `Recorded ${created.status} verification`, after: { entityType: created.entityType, entityId: created.entityId, sourceId: created.sourceId } });
      return created;
    });
    return valid(record);
  }
  return invalid([{ message: "This resource is updated through moderation, not created directly" }]);
}

async function updatePokemon(id: string, body: unknown, actorId: string): Promise<Result> {
  const parsed = pokemonUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, availability, availableAt, availabilityNotes, ...data } = parsed.data;
  const record = await db().$transaction(async (tx) => {
    const before = await tx.pokemon.findUniqueOrThrow({ where: { id }, include: { availability: true } });
    const updated = await tx.pokemon.update({
      where: { id },
      data: {
        ...data,
        verificationStatus,
        availability: {
          upsert: {
            create: { status: availability ?? "UNVERIFIED", availableAt, checkedAt: new Date(), notes: availabilityNotes },
            update: {
              ...(availability ? { status: availability } : {}),
              ...(availableAt !== undefined ? { availableAt } : {}),
              ...(availabilityNotes !== undefined ? { notes: availabilityNotes } : {}),
              checkedAt: new Date(),
            },
          },
        },
      },
      include: { availability: true },
    });
    await recordVerification(tx, { actorId, entityType: "Pokemon", entityId: id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, {
      actorId,
      entityType: "Pokemon",
      entityId: id,
      action: "UPDATE",
      summary: `Updated Pokémon ${updated.name}`,
      before: { slug: before.slug, availability: before.availability?.status ?? "UNVERIFIED", verificationStatus: before.verificationStatus },
      after: { slug: updated.slug, availability: updated.availability?.status ?? "UNVERIFIED", verificationStatus: updated.verificationStatus },
    });
    return updated;
  });
  return valid(record);
}

async function updateForm(id: string, body: unknown, actorId: string): Promise<Result> {
  const parsed = formUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
  const record = await db().$transaction(async (tx) => {
    const before = await tx.pokemonForm.findUniqueOrThrow({ where: { id } });
    const updated = await tx.pokemonForm.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } });
    await recordVerification(tx, { actorId, entityType: "PokemonForm", entityId: id, sourceId, status: verificationStatus ?? updated.verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "PokemonForm", entityId: id, action: "UPDATE", summary: `Updated form ${updated.name}`, before: { slug: before.slug, verificationStatus: before.verificationStatus }, after: { slug: updated.slug, verificationStatus: updated.verificationStatus } });
    return updated;
  });
  return valid(record);
}

async function updateCatalog(resource: "moves" | "abilities" | "items", id: string, body: unknown, actorId: string): Promise<Result> {
  const schema = resource === "moves" ? moveUpdateSchema : resource === "abilities" ? abilityUpdateSchema : itemUpdateSchema;
  const parsed = schema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
  const record = await db().$transaction(async (tx) => {
    const before = resource === "moves" ? await tx.move.findUniqueOrThrow({ where: { id } }) : resource === "abilities" ? await tx.ability.findUniqueOrThrow({ where: { id } }) : await tx.item.findUniqueOrThrow({ where: { id } });
    const updated = resource === "moves"
      ? await tx.move.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } })
      : resource === "abilities"
        ? await tx.ability.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } })
        : await tx.item.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } });
    const entityType = resource === "moves" ? "Move" : resource === "abilities" ? "Ability" : "Item";
    await recordVerification(tx, { actorId, entityType, entityId: id, sourceId, status: verificationStatus ?? updated.verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType, entityId: id, action: "UPDATE", summary: `Updated ${entityType.toLowerCase()} ${updated.name}`, before: { name: before.name, verificationStatus: before.verificationStatus }, after: { name: updated.name, verificationStatus: updated.verificationStatus } });
    return updated;
  });
  return valid(record);
}

async function updateRegulation(id: string, body: unknown, actorId: string): Promise<Result> {
  const parsed = regulationUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, pokemon, moves, abilities, items, ...data } = parsed.data;
  const record = await db().$transaction(async (tx) => {
    const before = await tx.regulation.findUniqueOrThrow({ where: { id } });
    const format = data.format ?? before.format;
    const startsAt = data.startsAt === undefined ? before.startsAt : data.startsAt;
    const endsAt = data.endsAt === undefined ? before.endsAt : data.endsAt;
    if (startsAt && endsAt && startsAt > endsAt) throw new Response("Regulation end date must not precede its start date", { status: 422 });
    const replacedCurrent = data.isCurrent ? await tx.regulation.findMany({ where: { format, isCurrent: true, NOT: { id } }, select: { id: true, name: true } }) : [];
    if (replacedCurrent.length) await tx.regulation.updateMany({ where: { id: { in: replacedCurrent.map((entry) => entry.id) } }, data: { isCurrent: false } });
    if (pokemon) await ensureFormOwnership(tx, pokemon);
    if (pokemon) { await tx.regulationPokemon.deleteMany({ where: { regulationId: id } }); await tx.regulationPokemon.createMany({ data: pokemon.map((entry: { pokemonId: string; formId?: string | null; isLegal: boolean; notes?: string | null }) => ({ regulationId: id, ...entry, formId: entry.formId || null })) }); }
    if (moves) { await tx.regulationMove.deleteMany({ where: { regulationId: id } }); await tx.regulationMove.createMany({ data: moves.map((entry: { id: string; isLegal: boolean }) => ({ regulationId: id, moveId: entry.id, isLegal: entry.isLegal })) }); }
    if (abilities) { await tx.regulationAbility.deleteMany({ where: { regulationId: id } }); await tx.regulationAbility.createMany({ data: abilities.map((entry: { id: string; isLegal: boolean }) => ({ regulationId: id, abilityId: entry.id, isLegal: entry.isLegal })) }); }
    if (items) { await tx.regulationItem.deleteMany({ where: { regulationId: id } }); await tx.regulationItem.createMany({ data: items.map((entry: { id: string; isLegal: boolean }) => ({ regulationId: id, itemId: entry.id, isLegal: entry.isLegal })) }); }
    const updated = await tx.regulation.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } });
    await recordVerification(tx, { actorId, entityType: "Regulation", entityId: id, sourceId, status: verificationStatus ?? updated.verificationStatus, notes: verificationNotes });
    for (const previous of replacedCurrent) await recordAudit(tx, { actorId, entityType: "Regulation", entityId: previous.id, action: "UPDATE", summary: `Replaced current regulation ${previous.name}`, before: { isCurrent: true }, after: { isCurrent: false } });
    await recordAudit(tx, { actorId, entityType: "Regulation", entityId: id, action: "UPDATE", summary: `Updated regulation ${updated.name}`, before: { format: before.format, verificationStatus: before.verificationStatus }, after: { format: updated.format, verificationStatus: updated.verificationStatus } });
    return updated;
  });
  return valid(record);
}

async function updateTierList(id: string, body: unknown, actorId: string): Promise<Result> {
  const parsed = tierListUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const { sourceId, verificationStatus, verificationNotes, entries, ...data } = parsed.data;
  const record = await db().$transaction(async (tx) => {
    const before = await tx.tierList.findUniqueOrThrow({ where: { id }, include: { entries: true } });
    const regulationId = data.regulationId ?? before.regulationId; const format = data.format ?? before.format;
    if (entries || data.regulationId || data.format) {
      await ensureRankable(tx, regulationId, format, (entries ?? before.entries).map((entry) => entry.pokemonId));
    }
    if (entries) {
      const previous = new Map(before.entries.map((entry) => [entry.pokemonId, entry]));
      await tx.tierEntry.deleteMany({ where: { tierListId: id } });
      if (entries.length) {
        await tx.tierEntry.createMany({ data: entries.map((entry, ranking) => ({ tierListId: id, ...entry, ranking })) });
        const changes = entries.map((entry, ranking) => ({ entry, ranking, old: previous.get(entry.pokemonId) })).filter(({ old, entry, ranking }) => !old || old.tier !== entry.tier || old.ranking !== ranking);
        if (changes.length) await tx.tierHistory.createMany({ data: changes.map(({ entry, ranking, old }) => ({ pokemonId: entry.pokemonId, regulationId, format, previousTier: old?.tier ?? null, newTier: entry.tier, ranking, explanation: entry.explanation })) });
      }
    }
    const updated = await tx.tierList.update({ where: { id }, data, include: { entries: { orderBy: { ranking: "asc" } } } });
    await recordVerification(tx, { actorId, entityType: "TierList", entityId: id, sourceId, status: verificationStatus, notes: verificationNotes });
    await recordAudit(tx, { actorId, entityType: "TierList", entityId: id, action: "UPDATE", summary: `Updated official tier list ${updated.name}`, before: { entries: before.entries.length }, after: { entries: updated.entries.length } });
    return updated;
  });
  return valid(record);
}

export async function updateAdminResource(resource: AdminResource, id: string, body: unknown, actorId: string): Promise<Result> {
  if (resource === "pokemon") return updatePokemon(id, body, actorId);
  if (resource === "forms") return updateForm(id, body, actorId);
  if (resource === "moves" || resource === "abilities" || resource === "items") return updateCatalog(resource, id, body, actorId);
  if (resource === "regulations") return updateRegulation(id, body, actorId);
  if (resource === "tier-lists") return updateTierList(id, body, actorId);
  if (resource === "statistics") {
    const parsed = statisticUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const { sourceId, verificationStatus, verificationNotes, ...data } = parsed.data;
    const record = await db().$transaction(async (tx) => {
      const before = await tx.usageStatistic.findUniqueOrThrow({ where: { id } });
      const updated = await tx.usageStatistic.update({ where: { id }, data: { ...data, ...(verificationStatus ? { verificationStatus } : {}) } });
      await recordVerification(tx, { actorId, entityType: "UsageStatistic", entityId: id, sourceId, status: verificationStatus ?? updated.verificationStatus, notes: verificationNotes });
      await recordAudit(tx, { actorId, entityType: "UsageStatistic", entityId: id, action: "UPDATE", summary: "Updated sourced usage statistic", before: { verificationStatus: before.verificationStatus }, after: { verificationStatus: updated.verificationStatus } }); return updated;
    }); return valid(record);
  }
  if (resource === "users") {
    const parsed = userUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    if (id === actorId && (parsed.data.role && parsed.data.role !== "ADMIN" || parsed.data.status === "SUSPENDED")) return invalid([{ message: "You cannot remove your own admin access" }]);
    const { password, ...data } = parsed.data;
    const record = await db().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(827100643)::text AS lock_status`;
      const before = await tx.user.findUniqueOrThrow({ where: { id }, select: { id: true, role: true, status: true, email: true } });
      if (before.role === "ADMIN" && before.status === "ACTIVE" && (data.role && data.role !== "ADMIN" || data.status === "SUSPENDED")) {
        const admins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        if (admins <= 1) throw new Response("At least one active administrator is required", { status: 422 });
      }
      const updated = await tx.user.update({ where: { id }, data: { ...data, ...(password ? { passwordHash: await hash(password, 12) } : {}) }, select: { id: true, name: true, username: true, email: true, role: true, status: true } });
      await recordAudit(tx, { actorId, entityType: "User", entityId: id, action: "UPDATE", summary: `Updated user ${updated.email}`, before: { role: before.role, status: before.status }, after: { role: updated.role, status: updated.status } }); return updated;
    }); return valid(record);
  }
  if (resource === "sources") {
    const parsed = sourceUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const record = await db().$transaction(async (tx) => { const before = await tx.dataSource.findUniqueOrThrow({ where: { id } }); const updated = await tx.dataSource.update({ where: { id }, data: parsed.data }); await recordAudit(tx, { actorId, entityType: "DataSource", entityId: id, action: "UPDATE", summary: `Updated source ${updated.name}`, before: { url: before.url }, after: { url: updated.url } }); return updated; }); return valid(record);
  }
  if (resource === "verifications") {
    const parsed = verificationUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
    const record = await db().$transaction(async (tx) => { const before = await tx.dataVerification.findUniqueOrThrow({ where: { id } }); const updated = await tx.dataVerification.update({ where: { id }, data: { ...parsed.data, verifiedById: actorId } }); await assertVerifiableEntity(tx, updated.entityType, updated.entityId); await syncEntityVerification(tx, updated.entityType, updated.entityId, updated.status); await recordAudit(tx, { actorId, entityType: "DataVerification", entityId: id, action: "UPDATE", summary: `Updated verification to ${updated.status}`, before: { status: before.status }, after: { status: updated.status } }); return updated; }); return valid(record);
  }
  const parsed = moderationUpdateSchema.safeParse(body); if (!parsed.success) return invalid(parsed.error.issues);
  const record = await db().$transaction(async (tx) => {
    const updated = resource === "community-lists" ? await tx.communityTierList.update({ where: { id }, data: { moderationStatus: parsed.data.moderationStatus } }) : await tx.comment.update({ where: { id }, data: { moderationStatus: parsed.data.moderationStatus } });
    const entityType = resource === "community-lists" ? "CommunityTierList" : "Comment";
    await recordAudit(tx, { actorId, entityType, entityId: id, action: "MODERATE", summary: parsed.data.reason, after: { moderationStatus: parsed.data.moderationStatus } }); return updated;
  }); return valid(record);
}

export async function deleteAdminResource(resource: AdminResource, id: string, actorId: string): Promise<unknown> {
  if (resource === "users") {
    if (id === actorId) throw new Response("You cannot delete your own account", { status: 422 });
    return db().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(827100643)::text AS lock_status`;
      const before = await tx.user.findUniqueOrThrow({ where: { id }, select: { email: true, role: true, status: true } });
      if (before.role === "ADMIN" && before.status === "ACTIVE" && await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }) <= 1) throw new Response("At least one active administrator is required", { status: 422 });
      await recordAudit(tx, { actorId, entityType: "User", entityId: id, action: "DELETE", summary: `Deleted user ${before.email}`, before: { role: before.role, status: before.status } });
      return tx.user.delete({ where: { id }, select: { id: true } });
    });
  }
  if (resource === "community-lists" || resource === "comments") return updateAdminResource(resource, id, { moderationStatus: "REMOVED", reason: "Removed by administrator" }, actorId);
  return db().$transaction(async (tx) => {
    let label = id; let entityType: string = resource;
    if (resource === "pokemon") {
      const record = await tx.pokemon.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { regulations: true, tierEntries: true, tierHistory: true, usageStatistics: true, teamSlots: true, communityEntries: true, favorites: true } } } });
      if (Object.values(record._count).some((count) => count > 0)) throw new Response("Pokémon referenced by regulations, rankings, statistics, teams, community lists, or favorites cannot be deleted", { status: 409 });
      await tx.pokemon.delete({ where: { id } }); label = record.name; entityType = "Pokemon";
    }
    else if (resource === "forms") { const record = await tx.pokemonForm.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { regulations: true, teamSlots: true } } } }); if (Object.values(record._count).some((count) => count > 0)) throw new Response("Forms referenced by regulations or teams cannot be deleted", { status: 409 }); await tx.pokemonForm.delete({ where: { id } }); label = record.name; entityType = "PokemonForm"; }
    else if (resource === "moves") { const record = await tx.move.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { regulations: true, teamSelections: true } } } }); if (Object.values(record._count).some((count) => count > 0)) throw new Response("Moves referenced by regulations or teams cannot be deleted", { status: 409 }); await tx.move.delete({ where: { id } }); label = record.name; entityType = "Move"; }
    else if (resource === "abilities") { const record = await tx.ability.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { regulations: true, teamSelections: true } } } }); if (Object.values(record._count).some((count) => count > 0)) throw new Response("Abilities referenced by regulations or teams cannot be deleted", { status: 409 }); await tx.ability.delete({ where: { id } }); label = record.name; entityType = "Ability"; }
    else if (resource === "items") { const record = await tx.item.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { regulations: true, teamSelections: true } } } }); if (Object.values(record._count).some((count) => count > 0)) throw new Response("Items referenced by regulations or teams cannot be deleted", { status: 409 }); await tx.item.delete({ where: { id } }); label = record.name; entityType = "Item"; }
    else if (resource === "regulations") { const dependencies = await tx.regulation.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { tierLists: true, tierHistory: true, usageStatistics: true, teams: true, communityTierLists: true } } } }); if (Object.values(dependencies._count).some((count) => count > 0)) throw new Response("Regulations with rankings, statistics, or teams cannot be deleted", { status: 409 }); await tx.regulation.delete({ where: { id } }); label = dependencies.name; entityType = "Regulation"; }
    else if (resource === "tier-lists") { const record = await tx.tierList.delete({ where: { id } }); label = record.name; entityType = "TierList"; }
    else if (resource === "statistics") { await tx.usageStatistic.delete({ where: { id } }); entityType = "UsageStatistic"; }
    else if (resource === "sources") { const record = await tx.dataSource.findUniqueOrThrow({ where: { id }, select: { name: true, _count: { select: { verifications: true } } } }); if (record._count.verifications > 0) throw new Response("Sources attached to verification records cannot be deleted", { status: 409 }); await tx.dataSource.delete({ where: { id } }); label = record.name; entityType = "DataSource"; }
    else if (resource === "verifications") {
      const deleted = await tx.dataVerification.delete({ where: { id } });
      const latest = await tx.dataVerification.findFirst({ where: { entityType: deleted.entityType, entityId: deleted.entityId }, orderBy: { updatedAt: "desc" }, select: { status: true } });
      await syncEntityVerification(tx, deleted.entityType, deleted.entityId, latest?.status ?? "UNVERIFIED");
      entityType = "DataVerification";
    }
    await recordAudit(tx, { actorId, entityType, entityId: id, action: "DELETE", summary: `Deleted ${resource} record ${label}` });
    return { id };
  });
}
