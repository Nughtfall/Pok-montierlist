import { notFound } from "next/navigation";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { Badge, Card, PageHeading } from "@/components/ui";

export default async function SharedTeam({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params;
  if (!isDatabaseConfigured()) notFound();
  const team = await db().team.findFirst({
    where: { shareSlug, isPublic: true },
    include: { regulation: true, owner: { select: { name: true, username: true } }, pokemon: { orderBy: { position: "asc" }, include: { pokemon: true, form: true, ability: true, item: true, moves: { orderBy: { position: "asc" }, include: { move: true } } } } },
  });
  if (!team) notFound();
  return <><PageHeading eyebrow="Shared team" title={team.name} description={`${team.regulation.name} · ${team.format} · by ${team.owner.name||team.owner.username||"Trainer"}`}/><div className="grid gap-4 lg:grid-cols-2">{team.pokemon.map(slot=><Card key={slot.id} className="p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{slot.pokemon.name}</h2><Badge>{slot.form?.name||"Base form"}</Badge></div><p className="muted mt-3 text-sm">{slot.ability?.name||"No ability"} · {slot.item?.name||"No item"}</p><div className="mt-4 flex flex-wrap gap-2">{slot.moves.map(x=><Badge key={x.moveId}>{x.move.name}</Badge>)}</div></Card>)}</div></>;
}
