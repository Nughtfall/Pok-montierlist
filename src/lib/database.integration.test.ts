import { afterAll, describe, expect, it } from "vitest";
import { db } from "./prisma";
import { createAdminResource, deleteAdminResource, updateAdminResource } from "./admin-operations";
import { promoteFirstAdmin } from "./admin-bootstrap";

const integration = describe.skipIf(!process.env.DATABASE_URL);
const suffix = `test-${Date.now()}`;
const createdIds: string[] = [];
let adminId: string | undefined;

integration("PostgreSQL operations and roster filtering", () => {
  afterAll(async () => {
    if (createdIds.length) await db().pokemon.deleteMany({ where: { id: { in: createdIds } } });
    if (adminId) {
      await db().changeLog.deleteMany({ where: { changedById: adminId } });
      await db().user.deleteMany({ where: { id: adminId } });
    }
  });

  it("persists records but only selects AVAILABLE Pokémon for the playable roster", async () => {
    const available = await db().pokemon.create({
      data: { slug: `${suffix}-available`, name: "Integration Available", strengths: [], weaknesses: [], availability: { create: { status: "AVAILABLE" } } },
    });
    const unavailable = await db().pokemon.create({
      data: { slug: `${suffix}-unavailable`, name: "Integration Unavailable", strengths: [], weaknesses: [], availability: { create: { status: "UNRELEASED" } } },
    });
    createdIds.push(available.id, unavailable.id);

    const playable = await db().pokemon.findMany({
      where: { id: { in: createdIds }, availability: { status: "AVAILABLE" } },
      select: { id: true },
    });
    expect(playable.map((entry) => entry.id)).toEqual([available.id]);
  });

  it("promotes exactly the first active administrator and audits the operator action", async () => {
    const operator = await db().user.create({ data: { email: `${suffix}-operator@example.test` } });
    try {
      const promoted = await promoteFirstAdmin(operator.email);
      expect(promoted.role).toBe("ADMIN");
      expect(await db().changeLog.findFirst({ where: { entityType: "User", entityId: operator.id, action: "BOOTSTRAP_ADMIN" } })).not.toBeNull();
      await expect(promoteFirstAdmin(operator.email)).rejects.toThrow("already exists");
    } finally {
      await db().changeLog.deleteMany({ where: { entityType: "User", entityId: operator.id } });
      await db().user.delete({ where: { id: operator.id } });
    }
  });

  it("creates, updates, deletes, and audits an admin-managed source", async () => {
    const admin = await db().user.create({ data: { email: `${suffix}@example.test`, role: "ADMIN" } });
    adminId = admin.id;
    const created = await createAdminResource("sources", { name: "Integration source", url: `https://example.test/${suffix}`, isOfficial: true }, admin.id);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const sourceId = (created.data as { id: string }).id;
    const createdPokemon = await createAdminResource("pokemon", {
      sourceId,
      verificationStatus: "OFFICIAL",
      verificationNotes: "Integration verification",
      slug: `${suffix}-managed`,
      name: "Integration Managed",
      availability: "UNVERIFIED",
      strengths: [],
      weaknesses: [],
    }, admin.id);
    expect(createdPokemon.ok).toBe(true);
    if (!createdPokemon.ok) return;
    const pokemonId = (createdPokemon.data as { id: string }).id;
    const updatedPokemon = await updateAdminResource("pokemon", pokemonId, {
      sourceId,
      verificationStatus: "OFFICIAL",
      verificationNotes: "Availability confirmed",
      availability: "AVAILABLE",
    }, admin.id);
    expect(updatedPokemon.ok).toBe(true);
    expect(await db().championsAvailability.findUnique({ where: { pokemonId }, select: { status: true } })).toEqual({ status: "AVAILABLE" });
    await deleteAdminResource("pokemon", pokemonId, admin.id);
    expect(await db().pokemon.findUnique({ where: { id: pokemonId } })).toBeNull();
    await db().dataVerification.deleteMany({ where: { entityType: "Pokemon", entityId: pokemonId } });

    const createdItem = await createAdminResource("items", {
      sourceId,
      verificationStatus: "OFFICIAL",
      slug: `${suffix}-item`,
      name: "Integration Item",
      availability: "AVAILABLE",
    }, admin.id);
    expect(createdItem.ok).toBe(true);
    if (!createdItem.ok) return;
    const itemId = (createdItem.data as { id: string }).id;
    const verification = await db().dataVerification.findFirstOrThrow({ where: { entityType: "Item", entityId: itemId } });
    await deleteAdminResource("verifications", verification.id, admin.id);
    expect(await db().item.findUnique({ where: { id: itemId }, select: { verificationStatus: true } })).toEqual({ verificationStatus: "UNVERIFIED" });
    await deleteAdminResource("items", itemId, admin.id);

    const updated = await updateAdminResource("sources", sourceId, { notes: "Verified integration update" }, admin.id);
    expect(updated.ok).toBe(true);
    await deleteAdminResource("sources", sourceId, admin.id);

    expect(await db().dataSource.findUnique({ where: { id: sourceId } })).toBeNull();
    const actions = await db().changeLog.findMany({ where: { changedById: admin.id, entityId: sourceId }, orderBy: { createdAt: "asc" }, select: { action: true } });
    expect(actions.map((entry) => entry.action)).toEqual(["CREATE", "UPDATE", "DELETE"]);
  });
});
