import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { CommunityBuilder } from "@/components/community-builder";
import { CommunityListActions } from "@/components/community-list-actions";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui";

export default async function MyTierLists({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") redirect("/login");
  const { edit } = await searchParams;
  const [lists, regulations, pokemon, editing] = await Promise.all([
    db().communityTierList.findMany({ where: { authorId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { regulation: { select: { name: true } }, _count: { select: { entries: true, votes: true, comments: true } } } }),
    db().regulation.findMany({ where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, select: { id: true, name: true, format: true } }),
    db().pokemon.findMany({ where: { availability: { status: "AVAILABLE" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    edit ? db().communityTierList.findFirst({ where: { id: edit, authorId: session.user.id }, include: { entries: { orderBy: { ranking: "asc" }, select: { pokemonId: true, tier: true } } } }) : null,
  ]);
  const initialList = editing ? { id: editing.id, title: editing.title, description: editing.description, regulationId: editing.regulationId, entries: editing.entries } : null;
  return <><PageHeading eyebrow="Community studio" title="My tier lists" description="Create, edit, share, and remove community rankings. They remain clearly separated from official editorial rankings."/>{regulations.length && pokemon.length ? <CommunityBuilder regulations={regulations} pokemon={pokemon} initialList={initialList}/> : <EmptyState title="Creation data unavailable" description="A verified regulation and available Champions roster are required before publishing a community list."/>}{lists.length ? <div className="space-y-3">{lists.map((list) => <Card key={list.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><div className="flex gap-2"><Badge tone="warning">Community</Badge><Badge tone={list.isPublic ? "success" : "default"}>{list.isPublic ? "Public" : "Private"}</Badge>{list.moderationStatus !== "PUBLISHED" && <Badge tone="warning">{list.moderationStatus}</Badge>}</div><Link href={list.isPublic ? `/community/${list.slug}` : `/my-tier-lists?edit=${list.id}`} className="mt-3 block font-bold hover:text-cyan-300">{list.title}</Link><p className="muted mt-1 text-xs">{list.regulation.name} · {list._count.entries} entries · {list._count.votes} votes · {list._count.comments} comments</p></div><CommunityListActions id={list.id} slug={list.slug} isPublic={list.isPublic}/></Card>)}</div> : <EmptyState title="No tier lists" description="Create a regulation-aware community ranking above."/>}</>;
}
