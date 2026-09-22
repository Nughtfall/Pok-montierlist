import { adminActor, adminOperationError } from "@/lib/admin-api";
import { db } from "@/lib/prisma";

export async function GET() {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  try {
    const [pokemon, regulations, sources, moves, abilities, items] = await Promise.all([
      db().pokemon.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, availability: { select: { status: true } } } }),
      db().regulation.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, format: true, verificationStatus: true } }),
      db().dataSource.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, url: true } }),
      db().move.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      db().ability.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      db().item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    return Response.json({ data: { pokemon, regulations, sources, moves, abilities, items } });
  } catch (error) { return adminOperationError(error); }
}
