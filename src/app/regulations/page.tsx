import Link from "next/link";
import { verifiedRegulationDetails, verifiedRegulations } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui";

export default async function RegulationsPage({ searchParams }: { searchParams: Promise<{ selected?: string }> }) {
  const { selected = "" } = await searchParams;
  const [regulations, details] = await Promise.all([verifiedRegulations(), selected ? verifiedRegulationDetails(selected) : Promise.resolve(null)]);
  return <>
    <PageHeading eyebrow="Rules engine" title="Regulations" description="Database-driven Singles and Doubles rules with independent legality for Pokémon, forms, moves, abilities, and items."/>
    {selected && !details && Boolean(regulations?.length) && <EmptyState title="Verified regulation not found" description="The selected regulation is not present or does not have VERIFIED/OFFICIAL status."/>}
    {details && <Card className="mb-6 border-cyan-400/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex gap-2"><Badge tone={details.isCurrent ? "success" : "default"}>{details.isCurrent ? "Current" : "Archived"}</Badge><Badge>{details.format}</Badge><Badge>{details.verificationStatus}</Badge></div><h2 className="mt-4 text-2xl font-black">{details.name}</h2><p className="muted mt-2 max-w-3xl text-sm leading-6">{details.description || "No verified description is available."}</p></div><Link className="button button-secondary" href="/regulations">Close details</Link></div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><Metric label="Team limit" value={details.teamSizeLimit}/><Metric label="Move limit" value={details.moveLimit}/><Metric label="Starts" value={details.startsAt?.toLocaleDateString()}/><Metric label="Ends" value={details.endsAt?.toLocaleDateString()}/></dl>
      {details.restrictions && <div className="mt-5 rounded-xl border bg-black/10 p-4 text-sm"><span className="mr-2 font-bold text-cyan-300">Verified restrictions</span>{details.restrictions}</div>}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <LegalGroup title="Legal Pokémon" empty="No verified legal Pokémon." links={details.pokemon.map((entry) => ({ label: `${entry.pokemon.name}${entry.form ? ` · ${entry.form.name}` : ""}`, href: `/pokemon/${entry.pokemon.slug}` }))}/>
        <LegalGroup title="Legal moves" empty="No verified legal moves." links={details.moves.map((entry) => ({ label: entry.move.name, href: `/moves?selected=${entry.move.slug}` }))}/>
        <LegalGroup title="Legal abilities" empty="No verified legal abilities." links={details.abilities.map((entry) => ({ label: entry.ability.name, href: `/abilities?selected=${entry.ability.slug}` }))}/>
        <LegalGroup title="Legal items" empty="No verified legal items." links={details.items.map((entry) => ({ label: entry.item.name, href: `/items?selected=${entry.item.slug}` }))}/>
      </div>
      <div className="mt-6 border-t pt-5"><h3 className="text-sm font-bold">Verification sources</h3>{details.sources.length ? <div className="mt-3 flex flex-wrap gap-2">{details.sources.map((verification) => <a className="badge hover:border-cyan-300/40" href={verification.source.url} target="_blank" rel="noreferrer" key={verification.id}>{verification.source.name} · {verification.status}</a>)}</div> : <p className="muted mt-2 text-sm">No public source record is attached.</p>}</div>
    </Card>}
    {regulations?.length ? <div className="space-y-4">{regulations.map((regulation) => <Card key={regulation.id} className={selected === regulation.slug ? "border-cyan-400/40 p-6" : "p-6"}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex gap-2"><Badge tone={regulation.isCurrent ? "success" : "default"}>{regulation.isCurrent ? "Current" : "Archived"}</Badge><Badge>{regulation.format}</Badge></div><h2 className="mt-4 text-xl font-bold"><Link className="hover:text-cyan-300" href={`/regulations?selected=${regulation.slug}`}>{regulation.name}</Link></h2><p className="muted mt-2 max-w-2xl text-sm leading-6">{regulation.description || "No verified description is available."}</p></div><div className="grid grid-cols-2 gap-x-7 gap-y-2 text-xs"><span className="muted">Legal Pokémon</span><strong>{regulation._count.pokemon}</strong><span className="muted">Legal moves</span><strong>{regulation._count.moves}</strong><span className="muted">Legal abilities</span><strong>{regulation._count.abilities}</strong><span className="muted">Legal items</span><strong>{regulation._count.items}</strong></div></div></Card>)}</div> : <EmptyState title="Regulations unavailable" description="No sourced Pokémon Champions regulation is currently verified. Rules will never be inferred from another game."/>}
  </>;
}

function Metric({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="rounded-xl border p-3"><dt className="muted text-xs">{label}</dt><dd className="mt-1 font-semibold">{value ?? "Unverified"}</dd></div>;
}

function LegalGroup({ title, empty, links }: { title: string; empty: string; links: { label: string; href: string }[] }) {
  return <div><h3 className="text-sm font-bold">{title}</h3>{links.length ? <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-auto">{links.map((link) => <Link className="badge hover:border-cyan-300/40 hover:text-white" href={link.href} key={`${link.href}-${link.label}`}>{link.label}</Link>)}</div> : <p className="muted mt-2 text-sm">{empty}</p>}</div>;
}
