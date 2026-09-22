import "server-only";
import { connection } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/prisma";

async function runtimeDatabase() {
  await connection();
  return isDatabaseConfigured();
}

async function verifiedTierListIds() {
  const latest = await db().dataVerification.findMany({
    where: { entityType: "TierList" },
    distinct: ["entityId"],
    orderBy: { updatedAt: "desc" },
    select: { entityId: true, status: true },
  });
  return latest.filter((entry) => entry.status === "VERIFIED" || entry.status === "OFFICIAL").map((entry) => entry.entityId);
}

export async function dashboardData() {
  if (!(await runtimeDatabase())) return null;
  try {
    const [available, currentRegulations, verifiedTierLists, verifiedStats, recentChanges] = await Promise.all([
      db().championsAvailability.count({ where: { status: "AVAILABLE" } }),
      db().regulation.count({ where: { isCurrent: true, verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }),
      verifiedTierListIds(),
      db().usageStatistic.count({ where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }),
      db().changeLog.findMany({ take: 4, orderBy: { createdAt: "desc" }, select: { id: true, summary: true, createdAt: true } }),
    ]);
    const officialLists = await db().tierList.count({ where: { id: { in: verifiedTierLists }, publishedAt: { not: null } } });
    return { available, currentRegulations, officialLists, verifiedStats, recentChanges };
  } catch { return null; }
}

export async function availablePokemon() {
  if (!(await runtimeDatabase())) return null;
  try { return await db().pokemon.findMany({ where: { availability: { status: "AVAILABLE" } }, orderBy: { name: "asc" }, include: { availability: true, tierEntries: { take: 1, orderBy: { rankedAt: "desc" }, select: { tier: true } }, abilities: { where: { isVerified: true }, include: { ability: { select: { name: true } } } } } }); } catch { return null; }
}

export async function officialTierList() {
  if (!(await runtimeDatabase())) return null;
  try {
    const verified = await verifiedTierListIds();
    if (!verified.length) return null;
    return await db().tierList.findFirst({ where: { id: { in: verified }, publishedAt: { not: null }, regulation: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, orderBy: { publishedAt: "desc" }, include: { regulation: true, entries: { orderBy: { ranking: "asc" }, include: { pokemon: { select: { name: true, slug: true, primaryType: true, secondaryType: true, availability: { select: { status: true } } } } } } } });
  } catch { return null; }
}

export async function catalog(kind: "move" | "ability" | "item", query = "") {
  if (!(await runtimeDatabase())) return null;
  try {
    const name = query.trim() ? { contains: query.trim(), mode: "insensitive" as const } : undefined;
    const verificationStatus = { in: ["VERIFIED", "OFFICIAL"] as ("VERIFIED" | "OFFICIAL")[] };
    if (kind === "move") {
      const records = await db().move.findMany({
        where: { name, availability: "AVAILABLE", verificationStatus }, orderBy: { name: "asc" }, take: 300,
        include: {
          pokemon: { where: { isVerified: true, pokemon: { availability: { status: "AVAILABLE" } } }, select: { pokemon: { select: { name: true, slug: true } } } },
          regulations: { where: { isLegal: true, regulation: { verificationStatus } }, select: { regulation: { select: { name: true, slug: true, format: true } } } },
        },
      });
      return records.map((record) => ({ ...record, pokemon: record.pokemon.map((entry) => entry.pokemon), regulations: record.regulations.map((entry) => entry.regulation) }));
    }
    if (kind === "ability") {
      const records = await db().ability.findMany({
        where: { name, availability: "AVAILABLE", verificationStatus }, orderBy: { name: "asc" }, take: 300,
        include: {
          pokemon: { where: { isVerified: true, pokemon: { availability: { status: "AVAILABLE" } } }, select: { pokemon: { select: { name: true, slug: true } } } },
          regulations: { where: { isLegal: true, regulation: { verificationStatus } }, select: { regulation: { select: { name: true, slug: true, format: true } } } },
        },
      });
      return records.map((record) => ({ ...record, type: null, category: null, power: null, accuracy: null, priority: null, pokemon: record.pokemon.map((entry) => entry.pokemon), regulations: record.regulations.map((entry) => entry.regulation) }));
    }
    const records = await db().item.findMany({
      where: { name, availability: "AVAILABLE", verificationStatus }, orderBy: { name: "asc" }, take: 300,
      include: {
        pokemon: { where: { isVerified: true, pokemon: { availability: { status: "AVAILABLE" } } }, select: { pokemon: { select: { name: true, slug: true } } } },
        regulations: { where: { isLegal: true, regulation: { verificationStatus } }, select: { regulation: { select: { name: true, slug: true, format: true } } } },
      },
    });
    return records.map((record) => ({ ...record, type: null, category: null, power: null, accuracy: null, priority: null, pokemon: record.pokemon.map((entry) => entry.pokemon), regulations: record.regulations.map((entry) => entry.regulation) }));
  } catch { return null; }
}

export async function verifiedRegulations() {
  if (!(await runtimeDatabase())) return null;
  try {
    return await db().regulation.findMany({
      where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } },
      orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }],
      include: {
        _count: {
          select: {
            pokemon: { where: { isLegal: true } },
            moves: { where: { isLegal: true } },
            abilities: { where: { isLegal: true } },
            items: { where: { isLegal: true } },
          },
        },
      },
    });
  } catch { return null; }
}

export async function verifiedRegulationDetails(slug: string) {
  if (!(await runtimeDatabase()) || !slug) return null;
  try {
    const regulation = await db().regulation.findFirst({
      where: { slug, verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } },
      include: {
        pokemon: { where: { isLegal: true, pokemon: { availability: { status: "AVAILABLE" } } }, orderBy: { pokemon: { name: "asc" } }, include: { pokemon: { select: { name: true, slug: true } }, form: { select: { name: true } } } },
        moves: { where: { isLegal: true, move: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, orderBy: { move: { name: "asc" } }, include: { move: { select: { name: true, slug: true } } } },
        abilities: { where: { isLegal: true, ability: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, orderBy: { ability: { name: "asc" } }, include: { ability: { select: { name: true, slug: true } } } },
        items: { where: { isLegal: true, item: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, orderBy: { item: { name: "asc" } }, include: { item: { select: { name: true, slug: true } } } },
      },
    });
    if (!regulation) return null;
    const sources = await db().dataVerification.findMany({ where: { entityType: "Regulation", entityId: regulation.id }, orderBy: { checkedAt: "desc" }, include: { source: true }, take: 20 });
    return { ...regulation, sources };
  } catch { return null; }
}

export async function verifiedMeta() {
  if (!(await runtimeDatabase())) return null;
  try { return await db().usageStatistic.findMany({ where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, take: 20, orderBy: { usageRate: "desc" }, include: { pokemon: { select: { name: true, slug: true } }, regulation: { select: { name: true } } } }); } catch { return null; }
}

export async function communityLists() {
  if (!(await runtimeDatabase())) return null;
  try { return await db().communityTierList.findMany({ where: { isPublic: true, moderationStatus: "PUBLISHED" }, take: 24, orderBy: { updatedAt: "desc" }, include: { author: { select: { name: true, username: true } }, regulation: { select: { name: true } }, _count: { select: { entries: true, votes: true, comments: { where: { moderationStatus: "PUBLISHED" } } } } } }); } catch { return null; }
}

export async function builderOptions() {
  if (!(await runtimeDatabase())) return null;
  try {
    const [regulations, pokemon] = await Promise.all([
      db().regulation.findMany({ where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] }, teamSizeLimit: { not: null }, moveLimit: { not: null } }, select: { id: true, name: true, format: true, teamSizeLimit: true, moveLimit: true } }),
      db().pokemon.findMany({ where: { availability: { status: "AVAILABLE" } }, select: {
        id: true, name: true,
        regulations: { where: { isLegal: true }, select: { regulationId: true, formId: true } },
        forms: { select: { id: true, name: true } },
        moves: { where: { isVerified: true }, select: { move: { select: { id: true, name: true, regulations: { where: { isLegal: true }, select: { regulationId: true } } } } } },
        abilities: { where: { isVerified: true }, select: { ability: { select: { id: true, name: true, regulations: { where: { isLegal: true }, select: { regulationId: true } } } } } },
        items: { where: { isVerified: true }, select: { item: { select: { id: true, name: true, regulations: { where: { isLegal: true }, select: { regulationId: true } } } } } },
      } }),
    ]);
    return { regulations, pokemon };
  } catch { return null; }
}
