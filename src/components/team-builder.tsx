"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

type LegalReference = { regulationId: string };
type PokemonOption = {
  id: string;
  name: string;
  regulations: { regulationId: string; formId: string | null }[];
  forms: { id: string; name: string }[];
  moves: { move: { id: string; name: string; regulations: LegalReference[] } }[];
  abilities: { ability: { id: string; name: string; regulations: LegalReference[] } }[];
  items: { item: { id: string; name: string; regulations: LegalReference[] } }[];
};
type RegulationOption = { id: string; name: string; format: "SINGLES" | "DOUBLES"; teamSizeLimit: number | null; moveLimit: number | null };
type Slot = { pokemonId: string; formId: string; abilityId: string; itemId: string; moveIds: string[] };
type InitialTeam = { id: string; name: string; regulationId: string; isPublic: boolean; slots: Slot[] };

export function TeamBuilder({ regulations, pokemon, initialTeam }: { regulations: RegulationOption[]; pokemon: PokemonOption[]; initialTeam?: InitialTeam | null }) {
  const [name, setName] = useState(initialTeam?.name ?? "Untitled team");
  const [regulationId, setRegulationId] = useState(initialTeam?.regulationId ?? regulations[0]?.id ?? "");
  const [slots, setSlots] = useState<Slot[]>(initialTeam?.slots ?? []);
  const [message, setMessage] = useState("");
  const regulation = regulations.find((entry) => entry.id === regulationId);
  const legalPokemon = useMemo(() => pokemon.filter((entry) => entry.regulations.some((rule) => rule.regulationId === regulationId)), [pokemon, regulationId]);
  const used = useMemo(() => new Set(slots.map((entry) => entry.pokemonId)), [slots]);
  const teamLimit = regulation?.teamSizeLimit ?? 0;
  const moveLimit = regulation?.moveLimit ?? 0;

  function add() {
    const choice = legalPokemon.find((entry) => !used.has(entry.id));
    if (choice && slots.length < teamLimit) setSlots([...slots, { pokemonId: choice.id, formId: "", abilityId: "", itemId: "", moveIds: [] }]);
  }
  function changePokemon(index: number, pokemonId: string) {
    setSlots(slots.map((slot, position) => position === index ? { pokemonId, formId: "", abilityId: "", itemId: "", moveIds: [] } : slot));
  }
  function patchSlot(index: number, data: Partial<Slot>) {
    setSlots(slots.map((slot, position) => position === index ? { ...slot, ...data } : slot));
  }
  async function save() {
    setMessage("Validating on server…");
    const response = await fetch(initialTeam ? `/api/teams/${initialTeam.id}` : "/api/teams", {
      method: initialTeam ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, regulationId, format: regulation?.format, isPublic: initialTeam?.isPublic ?? false, pokemon: slots.map((slot) => ({ ...slot, formId: slot.formId || null, abilityId: slot.abilityId || null, itemId: slot.itemId || null })) }),
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? initialTeam ? "Team updated." : "Team saved." : payload.error === "Unauthorized" ? "Sign in to save this team." : payload.issues?.[0]?.message ?? payload.error ?? "Could not save team.");
  }

  return <div className="space-y-5">
    <div className="surface grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto]">
      <label><span className="label">Team name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={80}/></label>
      <label><span className="label">Verified regulation</span><select className="input" value={regulationId} onChange={(event) => { setRegulationId(event.target.value); setSlots([]); }}>{regulations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.format}</option>)}</select></label>
      <button className="button button-primary self-end" onClick={save} disabled={!regulationId}><Save size={16}/>{initialTeam ? "Update team" : "Save team"}</button>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">{slots.map((slot, index) => {
      const selected = pokemon.find((entry) => entry.id === slot.pokemonId);
      if (!selected) return null;
      const legalFormIds = new Set(selected.regulations.filter((rule) => rule.regulationId === regulationId && rule.formId).map((rule) => rule.formId));
      const forms = selected.forms.filter((form) => legalFormIds.has(form.id));
      const abilities = selected.abilities.map((entry) => entry.ability).filter((option) => option.regulations.some((rule) => rule.regulationId === regulationId));
      const items = selected.items.map((entry) => entry.item).filter((option) => option.regulations.some((rule) => rule.regulationId === regulationId));
      const moves = selected.moves.map((entry) => entry.move).filter((option) => option.regulations.some((rule) => rule.regulationId === regulationId));
      return <div key={`${index}-${slot.pokemonId}`} className="surface p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/12 text-xs font-black text-violet-300">{index + 1}</span><select className="input" value={slot.pokemonId} onChange={(event) => changePokemon(index, event.target.value)}>{legalPokemon.map((entry) => <option key={entry.id} value={entry.id} disabled={used.has(entry.id) && entry.id !== slot.pokemonId}>{entry.name}</option>)}</select><button aria-label="Remove Pokémon" onClick={() => setSlots(slots.filter((_, position) => position !== index))} className="text-rose-300"><Trash2 size={18}/></button></div>
        <div className="grid gap-3 sm:grid-cols-3"><Select label="Form" value={slot.formId} options={forms} onChange={(value) => patchSlot(index, { formId: value })}/><Select label="Ability" value={slot.abilityId} options={abilities} onChange={(value) => patchSlot(index, { abilityId: value })}/><Select label="Item" value={slot.itemId} options={items} onChange={(value) => patchSlot(index, { itemId: value })}/></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{Array.from({ length: moveLimit }, (_, moveIndex) => <Select key={moveIndex} label={`Move ${moveIndex + 1}`} value={slot.moveIds[moveIndex] ?? ""} options={moves} onChange={(value) => { const next = [...slot.moveIds]; if (value) next[moveIndex] = value; else next.splice(moveIndex, 1); patchSlot(index, { moveIds: next.filter(Boolean) }); }}/>)}</div>
      </div>;
    })}</div>
    {slots.length < teamLimit && <button className="button button-secondary w-full border-dashed" onClick={add} disabled={slots.length >= legalPokemon.length}><Plus size={16}/>Add legal Pokémon</button>}
    <p className="muted min-h-5 text-center text-sm" aria-live="polite">{message}</p>
  </div>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { id: string; name: string }[]; onChange: (value: string) => void }) {
  return <label><span className="label">{label}</span><select className="input" value={value} onChange={(event) => onChange(event.target.value)}><option value="">None</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}
