import Link from "next/link";
import { Search } from "lucide-react";
import { catalog } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui";

type CatalogKind = "move" | "ability" | "item";

export async function CatalogPage({
  kind,
  title,
  description,
  query = "",
  selected = "",
}: {
  kind: CatalogKind;
  title: string;
  description: string;
  query?: string;
  selected?: string;
}) {
  const entries = await catalog(kind, query);
  const path = kind === "move" ? "/moves" : kind === "ability" ? "/abilities" : "/items";

  return <>
    <PageHeading eyebrow="Verified reference" title={title} description={description}/>
    <form className="surface mb-6 flex gap-3 p-4" action={path}>
      <label className="relative flex-1">
        <span className="sr-only">Search {kind}s</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
        <input className="input pl-10" name="q" defaultValue={query} placeholder={`Search verified ${kind}s…`}/>
      </label>
      <button className="button button-primary" type="submit">Search</button>
      {query && <Link className="button button-secondary" href={path}>Clear</Link>}
    </form>
    {entries?.length ? <div className="grid-auto">{entries.map((entry) => {
      const active = selected === entry.slug;
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      search.set("selected", entry.slug);
      return <Card id={entry.slug} key={entry.id} className={`p-5 transition ${active ? "border-cyan-400/50 bg-cyan-400/[.04]" : "surface-hover"}`}>
        <div className="flex items-center justify-between"><Badge tone="success">{entry.availability}</Badge><span className="muted text-[10px] font-bold">{entry.verificationStatus}</span></div>
        <h2 className="mt-5 text-lg font-bold"><Link href={`${path}?${search.toString()}#${entry.slug}`} className="hover:text-cyan-300">{entry.name}</Link></h2>
        {kind === "move" && <div className="mt-2 flex flex-wrap gap-2 text-xs"><Badge>{entry.type ?? "Type unverified"}</Badge><Badge>{entry.category ?? "Category unverified"}</Badge>{entry.power != null && <Badge>Power {entry.power}</Badge>}{entry.accuracy != null && <Badge>Accuracy {entry.accuracy}</Badge>}<Badge>Priority {entry.priority ?? 0}</Badge></div>}
        <p className="muted mt-3 text-sm leading-6">{entry.effect || "Effect not yet verified."}</p>
        {active && <div className="mt-5 space-y-4 border-t pt-4">
          <ReferenceLinks label="Verified Pokémon" empty="No verified compatible Pokémon." links={entry.pokemon.map((pokemon) => ({ label: pokemon.name, href: `/pokemon/${pokemon.slug}` }))}/>
          <ReferenceLinks label="Legal regulations" empty="No verified regulation currently marks this record legal." links={entry.regulations.map((regulation) => ({ label: `${regulation.name} · ${regulation.format}`, href: `/regulations?selected=${regulation.slug}` }))}/>
        </div>}
      </Card>;
    })}</div> : <EmptyState
      title={`No verified ${kind}s`}
      description={query ? `No verified ${kind} matches “${query}”.` : `No ${kind} records are currently verified as available in Pokémon Champions.`}
    />}
  </>;
}

function ReferenceLinks({ label, empty, links }: { label: string; empty: string; links: { label: string; href: string }[] }) {
  return <div><h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">{label}</h3>{links.length ? <div className="mt-2 flex flex-wrap gap-2">{links.map((link) => <Link className="badge hover:border-cyan-300/40 hover:text-white" href={link.href} key={`${link.href}-${link.label}`}>{link.label}</Link>)}</div> : <p className="muted mt-2 text-xs">{empty}</p>}</div>;
}
