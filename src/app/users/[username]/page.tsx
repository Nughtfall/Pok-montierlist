import Link from "next/link";
import { notFound } from "next/navigation";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui";

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!isDatabaseConfigured()) notFound();
  const user = await db().user.findFirst({
    where: { username, status: "ACTIVE" },
    select: {
      name: true, username: true, createdAt: true,
      teams: { where: { isPublic: true, shareSlug: { not: null } }, take: 12, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, format: true, shareSlug: true, regulation: { select: { name: true } }, _count: { select: { pokemon: true } } } },
      tierLists: { where: { isPublic: true, moderationStatus: "PUBLISHED" }, take: 12, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, slug: true, format: true, regulation: { select: { name: true } }, _count: { select: { entries: true, votes: true } } } },
    },
  });
  if (!user) notFound();
  return <><PageHeading eyebrow="Community profile" title={user.name||user.username||"Trainer"} description={`@${user.username} · Member since ${user.createdAt.toLocaleDateString()}`}/><div className="grid gap-6 lg:grid-cols-2"><section><h2 className="mb-3 font-bold">Shared teams</h2>{user.teams.length?<div className="space-y-3">{user.teams.map((team)=><Link href={`/teams/${team.shareSlug}`} key={team.id}><Card className="surface-hover p-5"><div className="flex gap-2"><Badge>{team.format}</Badge><Badge tone="success">Shared</Badge></div><h3 className="mt-3 font-bold">{team.name}</h3><p className="muted mt-1 text-xs">{team.regulation.name} · {team._count.pokemon} Pokémon</p></Card></Link>)}</div>:<EmptyState title="No shared teams" description="This trainer has not published a team."/>}</section><section><h2 className="mb-3 font-bold">Community tier lists</h2>{user.tierLists.length?<div className="space-y-3">{user.tierLists.map((list)=><Link href={`/community/${list.slug}`} key={list.id}><Card className="surface-hover p-5"><Badge tone="warning">Community</Badge><h3 className="mt-3 font-bold">{list.title}</h3><p className="muted mt-1 text-xs">{list.regulation.name} · {list.format} · {list._count.entries} entries</p></Card></Link>)}</div>:<EmptyState title="No public tier lists" description="This trainer has not published a community ranking."/>}</section></div></>;
}
