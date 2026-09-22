import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { Badge, Card, EmptyState } from "@/components/ui";
import { FavoriteButton } from "@/components/favorite-button";
import { displayTier } from "@/lib/utils";

export default async function PokemonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) notFound();
  const pokemon = await db().pokemon.findFirst({
    where: { slug, availability: { status: "AVAILABLE" } },
    include: {
      availability: true,
      forms: { where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, orderBy: { name: "asc" } },
      abilities: { where: { isVerified: true, ability: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, include: { ability: true } },
      moves: { where: { isVerified: true, move: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, include: { move: true } },
      items: { where: { isVerified: true, item: { availability: "AVAILABLE", verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, include: { item: true } },
      regulations: { where: { isLegal: true, regulation: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } }, include: { regulation: { select: { name: true, slug: true, format: true, isCurrent: true } }, form: { select: { name: true } } } },
      tierEntries: { where: { tierList: { publishedAt: { not: null }, regulation: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } } } }, orderBy: { rankedAt: "desc" }, take: 12, include: { tierList: { select: { id: true, name: true, format: true, regulation: { select: { name: true } } } } } },
      tierHistory: { orderBy: { changedAt: "desc" }, take: 12, include: { regulation: { select: { name: true } } } },
      usageStatistics: { where: { verificationStatus: { in: ["VERIFIED", "OFFICIAL"] } }, orderBy: { recordedAt: "desc" }, take: 10, include: { regulation: { select: { name: true } } } },
    },
  }).catch(() => null);
  if (!pokemon) notFound();
  const [session, sources, latestTierVerifications] = await Promise.all([
    auth(),
    db().dataVerification.findMany({ where: { entityType: "Pokemon", entityId: pokemon.id }, orderBy: { checkedAt: "desc" }, include: { source: true }, take: 12 }),
    db().dataVerification.findMany({ where: { entityType: "TierList", entityId: { in: pokemon.tierEntries.map((entry) => entry.tierListId) } }, distinct: ["entityId"], orderBy: { updatedAt: "desc" }, select: { entityId: true, status: true } }),
  ]);
  const verifiedTierIds = new Set(latestTierVerifications.filter((entry) => entry.status === "VERIFIED" || entry.status === "OFFICIAL").map((entry) => entry.entityId));
  const officialTiers = pokemon.tierEntries.filter((entry) => verifiedTierIds.has(entry.tierListId));
  const favorite = session?.user?.id && session.user.status === "ACTIVE" ? Boolean(await db().favorite.findUnique({ where: { userId_pokemonId: { userId: session.user.id, pokemonId: pokemon.id } }, select: { id: true } })) : false;

  return <>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><Badge tone="success">Champions available</Badge><h1 className="mt-4 text-4xl font-black">{pokemon.name}</h1><p className="muted mt-2">{[pokemon.primaryType, pokemon.secondaryType].filter(Boolean).join(" · ") || "Types unverified"}</p></div><div className="flex items-start gap-3"><Badge>{pokemon.verificationStatus}</Badge><FavoriteButton pokemonId={pokemon.id} initialFavorite={favorite}/></div></div>
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="space-y-5">
      <Card className="p-6"><h2 className="font-bold">Competitive profile</h2><p className="muted mt-3 text-sm leading-7">{pokemon.competitiveRole || "Competitive role is UNVERIFIED."}</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><Data label="Strengths" values={pokemon.strengths}/><Data label="Weaknesses" values={pokemon.weaknesses}/></div></Card>
      <Card className="p-6"><h2 className="font-bold">Verified toolkit</h2><div className="mt-5 grid gap-5 sm:grid-cols-3"><Data label="Abilities" values={pokemon.abilities.map((entry) => entry.ability.name)}/><Data label="Moves" values={pokemon.moves.map((entry) => entry.move.name)}/><Data label="Items" values={pokemon.items.map((entry) => entry.item.name)}/></div></Card>
      <Card className="p-6"><h2 className="font-bold">Regulation legality</h2>{pokemon.regulations.length ? <div className="mt-4 space-y-3">{pokemon.regulations.map((entry) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" key={entry.id}><div><Link href={`/regulations?selected=${entry.regulation.slug}`} className="font-semibold hover:text-cyan-300">{entry.regulation.name}</Link><p className="muted mt-1 text-xs">{entry.regulation.format}{entry.form ? ` · ${entry.form.name}` : " · Base form"}</p></div>{entry.regulation.isCurrent && <Badge tone="success">Current</Badge>}</div>)}</div> : <p className="muted mt-3 text-sm">No verified regulation currently marks this Pokémon legal.</p>}</Card>
      <Card className="p-6"><h2 className="font-bold">Verified statistics</h2>{pokemon.usageStatistics.length ? <div className="table-wrap mt-4"><table className="data-table"><thead><tr><th>Regulation</th><th>Format</th><th>Usage</th><th>Win rate</th><th>Sample</th></tr></thead><tbody>{pokemon.usageStatistics.map((stat) => <tr key={stat.id}><td>{stat.regulation.name}</td><td>{stat.format}</td><td>{stat.usageRate == null ? "Unavailable" : `${Number(stat.usageRate).toFixed(2)}%`}</td><td>{stat.winRate == null ? "Unavailable" : `${Number(stat.winRate).toFixed(2)}%`}</td><td>{stat.sampleSize ?? "Unavailable"}</td></tr>)}</tbody></table></div> : <p className="muted mt-3 text-sm">Statistics unavailable</p>}</Card>
    </div><div className="space-y-5">
      <Card className="p-6"><h2 className="font-bold">Official tier placements</h2>{officialTiers.length ? <div className="mt-3 space-y-2">{officialTiers.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-semibold">{entry.tierList.name}</p><p className="muted text-xs">{entry.tierList.regulation.name} · {entry.tierList.format}</p></div><Badge>{displayTier(entry.tier)} #{entry.ranking + 1}</Badge></div>)}</div> : <p className="muted mt-3 text-sm">No verified official placement.</p>}</Card>
      <Card className="p-6"><h2 className="font-bold">Forms</h2>{pokemon.forms.length ? <div className="mt-3 space-y-2">{pokemon.forms.map((form) => <div key={form.id} className="rounded-lg border p-3 text-sm">{form.name} <span className="muted ml-2 text-xs">{form.verificationStatus}</span></div>)}</div> : <p className="muted mt-3 text-sm">No verified forms.</p>}</Card>
      <Card className="p-6"><h2 className="font-bold">Tier history</h2>{pokemon.tierHistory.length ? <div className="mt-3 space-y-2">{pokemon.tierHistory.map((entry) => <div key={entry.id} className="rounded-lg border p-3"><p className="text-sm"><span className="muted">{entry.previousTier ? displayTier(entry.previousTier) : "Unranked"}</span> → <strong>{displayTier(entry.newTier)}</strong></p><p className="muted mt-1 text-xs">{entry.regulation.name} · {entry.changedAt.toLocaleDateString()}</p></div>)}</div> : <p className="muted mt-3 text-sm">No ranking history.</p>}</Card>
      <Card className="p-6"><h2 className="font-bold">Sources</h2>{sources.length ? <div className="mt-3 space-y-3">{sources.map((verification) => <div key={verification.id}><a href={verification.source.url} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-cyan-300">{verification.source.name}</a><p className="muted mt-1 text-xs">{verification.status}{verification.checkedAt ? ` · checked ${verification.checkedAt.toLocaleDateString()}` : ""}</p></div>)}</div> : <p className="muted mt-3 text-sm">No public source record is attached.</p>}</Card>
      <EmptyState title="Matchup and teammate data unavailable" description="No verified Pokémon Champions matchup or teammate dataset exists. PokeTierlist does not infer these claims from other games or community teams."/>
    </div></div>
  </>;
}

function Data({ label, values }: { label: string; values: string[] }) { return <div><h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">{label}</h3><p className="muted mt-2 text-sm leading-6">{values.join(", ") || "Unverified"}</p></div>; }
