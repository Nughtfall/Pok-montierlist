"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Regulation = { id: string; name: string; format: "SINGLES" | "DOUBLES" };
type Pokemon = { id: string; name: string };
type Entry = { pokemonId: string; tier: "S_PLUS" | "S" | "A_PLUS" | "A" | "B_PLUS" | "B" | "C" | "D" | "UNTIERED" };
type InitialList = { id: string; title: string; description: string | null; regulationId: string; entries: Entry[] };
const tiers: Entry["tier"][] = ["S_PLUS", "S", "A_PLUS", "A", "B_PLUS", "B", "C", "D", "UNTIERED"];

export function CommunityBuilder({ regulations, pokemon, initialList }: { regulations: Regulation[]; pokemon: Pokemon[]; initialList?: InitialList | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialList?.title ?? "");
  const [description, setDescription] = useState(initialList?.description ?? "");
  const [regulationId, setRegulationId] = useState(initialList?.regulationId ?? regulations[0]?.id ?? "");
  const [entries, setEntries] = useState<Entry[]>(initialList?.entries ?? []);
  const [message, setMessage] = useState("");

  async function save() {
    const regulation = regulations.find((entry) => entry.id === regulationId);
    const response = await fetch(initialList ? `/api/community/${initialList.id}` : "/api/community", { method: initialList ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description, regulationId: regulation?.id, format: regulation?.format, entries }) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? initialList ? "Community list updated" : "Community list created" : body.issues?.[0]?.message ?? body.error ?? "Save failed");
    if (response.ok) {
      if (initialList) router.push("/my-tier-lists");
      else { setTitle(""); setDescription(""); setEntries([]); router.refresh(); }
    }
  }
  function add() {
    const available = pokemon.find((entry) => !entries.some((current) => current.pokemonId === entry.id));
    if (available) setEntries([...entries, { pokemonId: available.id, tier: "UNTIERED" }]);
  }

  return <div className="surface mb-6 p-6"><h2 className="font-bold">{initialList ? "Edit community list" : "Create community list"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="label">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="input" required minLength={3} maxLength={100}/></label><label><span className="label">Regulation</span><select value={regulationId} onChange={(event) => { setRegulationId(event.target.value); setEntries([]); }} className="input">{regulations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.format}</option>)}</select></label><label className="sm:col-span-2"><span className="label">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} className="input" maxLength={1000}/></label></div><div className="mt-4 space-y-2">{entries.map((entry, index) => <div key={`${entry.pokemonId}-${index}`} className="grid grid-cols-[1fr_130px_auto] gap-2"><select className="input" value={entry.pokemonId} onChange={(event) => setEntries(entries.map((current, position) => position === index ? { ...current, pokemonId: event.target.value } : current))}>{pokemon.map((option) => <option key={option.id} value={option.id} disabled={entries.some((current, position) => position !== index && current.pokemonId === option.id)}>{option.name}</option>)}</select><select className="input" value={entry.tier} onChange={(event) => setEntries(entries.map((current, position) => position === index ? { ...current, tier: event.target.value as Entry["tier"] } : current))}>{tiers.map((tier) => <option key={tier} value={tier}>{tier.replace("_PLUS", "+")}</option>)}</select><button type="button" aria-label="Remove entry" onClick={() => setEntries(entries.filter((_, position) => position !== index))} className="px-2 text-rose-300"><Trash2 size={17}/></button></div>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={add} className="button button-secondary" disabled={entries.length >= pokemon.length}><Plus size={15}/>Add Pokémon</button><button type="button" onClick={() => void save()} className="button button-primary">{initialList ? "Save changes" : "Publish community list"}</button>{initialList && <button type="button" className="button button-secondary" onClick={() => router.push("/my-tier-lists")}>Cancel</button>}<span className="muted text-xs" aria-live="polite">{message}</span></div></div>;
}
