import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { TeamActions } from "@/components/team-actions";
import { Badge, ButtonLink, Card, EmptyState, PageHeading } from "@/components/ui";

export default async function MyTeams() {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") redirect("/login");
  const teams = await db().team.findMany({ where: { ownerId: session.user.id }, orderBy: { updatedAt: "desc" }, include: { regulation: { select: { name: true, teamSizeLimit: true } }, _count: { select: { pokemon: true } } } });
  return <><PageHeading eyebrow="Your workspace" title="My teams" description="Saved, editable, server-validated Champions teams." action={<ButtonLink href="/team-builder">New team</ButtonLink>}/>{teams.length ? <div className="space-y-3">{teams.map((team) => <Card key={team.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><div className="flex gap-2"><Badge>{team.format}</Badge>{team.isPublic && <Badge tone="success">Shared</Badge>}</div><Link href={`/team-builder?team=${team.id}`} className="mt-3 block font-bold hover:text-cyan-300">{team.name}</Link><p className="muted mt-1 text-xs">{team.regulation.name} · {team._count.pokemon}/{team.regulation.teamSizeLimit ?? "?"} Pokémon</p></div><div className="flex items-start gap-2"><Link className="button button-secondary !min-h-8 !px-3 text-xs" href={`/team-builder?team=${team.id}`}>Edit</Link><TeamActions id={team.id} isPublic={team.isPublic} shareSlug={team.shareSlug}/></div></Card>)}</div> : <EmptyState title="No saved teams" description="Build a legal team and save it to your account."/>}</>;
}
