import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { builderOptions } from "@/lib/queries";
import { TeamBuilder } from "@/components/team-builder";
import { EmptyState, PageHeading } from "@/components/ui";

export default async function TeamBuilderPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const options = await builderOptions();
  const { team: teamId } = await searchParams;
  let initialTeam = null;
  if (teamId) {
    const session = await auth();
    if (session?.user?.id && session.user.status === "ACTIVE") {
      const team = await db().team.findFirst({ where: { id: teamId, ownerId: session.user.id }, include: { pokemon: { orderBy: { position: "asc" }, include: { moves: { orderBy: { position: "asc" } } } } } });
      if (team) initialTeam = { id: team.id, name: team.name, regulationId: team.regulationId, isPublic: team.isPublic, slots: team.pokemon.map((slot) => ({ pokemonId: slot.pokemonId, formId: slot.formId ?? "", abilityId: slot.abilityId ?? "", itemId: slot.itemId ?? "", moveIds: slot.moves.map((move) => move.moveId) })) };
    }
  }
  return <><PageHeading eyebrow="Server-validated workspace" title={initialTeam ? "Edit team" : "Team builder"} description="Build, save, edit, duplicate, delete, and share regulation-aware teams. Every save is revalidated on the server."/>{options && options.regulations.length && options.pokemon.length ? <TeamBuilder {...options} initialTeam={initialTeam}/> : <EmptyState title="Builder data unavailable" description="A verified regulation and at least one AVAILABLE Pokémon are required before team construction can begin."/>}</>;
}
