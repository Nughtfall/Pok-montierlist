import { db, isDatabaseConfigured } from "@/lib/prisma";
import { searchSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = searchSchema.safeParse({ q });
  if (!parsed.success) return Response.json({ data: [] });
  if (!isDatabaseConfigured()) return Response.json({ data: [], databaseConfigured: false });
  const contains = { contains: parsed.data.q, mode: "insensitive" as const };
  const verified = { in: ["VERIFIED", "OFFICIAL"] as ("VERIFIED" | "OFFICIAL")[] };
  const [pokemon, moves, abilities, items, regulations, teams, users] = await Promise.all([
    db().pokemon.findMany({ where: { name: contains, availability: { status: "AVAILABLE" }, verificationStatus: verified }, take: 5, select: { name: true, slug: true } }),
    db().move.findMany({ where: { name: contains, availability: "AVAILABLE", verificationStatus: verified }, take: 5, select: { name: true, slug: true } }),
    db().ability.findMany({ where: { name: contains, availability: "AVAILABLE", verificationStatus: verified }, take: 5, select: { name: true, slug: true } }),
    db().item.findMany({ where: { name: contains, availability: "AVAILABLE", verificationStatus: verified }, take: 5, select: { name: true, slug: true } }),
    db().regulation.findMany({ where: { name: contains, verificationStatus: verified }, take: 5, select: { name: true, slug: true } }),
    db().team.findMany({ where: { name: contains, isPublic: true }, take: 5, select: { name: true, shareSlug: true } }),
    db().user.findMany({ where: { status: "ACTIVE", OR: [{ name: contains }, { username: contains }] }, take: 5, select: { name: true, username: true } }),
  ]);
  return Response.json({
    data: [
      ...pokemon.map((x) => ({ type: "Pokémon", label: x.name, href: `/pokemon/${x.slug}` })),
      ...moves.map((x) => ({ type: "Move", label: x.name, href: `/moves?selected=${x.slug}` })),
      ...abilities.map((x) => ({ type: "Ability", label: x.name, href: `/abilities?selected=${x.slug}` })),
      ...items.map((x) => ({ type: "Item", label: x.name, href: `/items?selected=${x.slug}` })),
      ...regulations.map((x) => ({ type: "Regulation", label: x.name, href: `/regulations?selected=${x.slug}` })),
      ...teams.filter((x) => x.shareSlug).map((x) => ({ type: "Team", label: x.name, href: `/teams/${x.shareSlug}` })),
      ...users.filter((x) => x.username).map((x) => ({ type: "User", label: x.name ?? x.username!, href: `/users/${x.username}` })),
    ],
  });
}
