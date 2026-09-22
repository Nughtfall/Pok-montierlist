"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookCheck, Database, FileClock, Gavel, MessageSquareWarning, ShieldCheck, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { AdminResource } from "@/lib/admin-validation";

type RecordValue = Record<string, unknown> & { id: string };
type Reference = { id: string; name: string; [key: string]: unknown };
type References = { pokemon: Reference[]; regulations: Reference[]; sources: (Reference & { url: string })[]; moves: Reference[]; abilities: Reference[]; items: Reference[] };

const sections: { resource: AdminResource; label: string; icon: typeof Database }[] = [
  { resource: "sources", label: "Sources", icon: BookCheck },
  { resource: "pokemon", label: "Pokémon", icon: Database },
  { resource: "forms", label: "Forms", icon: Database },
  { resource: "moves", label: "Moves", icon: Database },
  { resource: "abilities", label: "Abilities", icon: Database },
  { resource: "items", label: "Items", icon: Database },
  { resource: "regulations", label: "Regulations", icon: Gavel },
  { resource: "tier-lists", label: "Official tiers", icon: FileClock },
  { resource: "statistics", label: "Statistics", icon: FileClock },
  { resource: "users", label: "Users", icon: Users },
  { resource: "verifications", label: "Verification", icon: ShieldCheck },
  { resource: "community-lists", label: "Community lists", icon: MessageSquareWarning },
  { resource: "comments", label: "Comments", icon: MessageSquareWarning },
];

const sourced = new Set<AdminResource>(["pokemon", "forms", "moves", "abilities", "items", "regulations", "tier-lists", "statistics"]);
const moderation = new Set<AdminResource>(["community-lists", "comments"]);

function template(resource: AdminResource) {
  const common = { verificationStatus: "UNVERIFIED", verificationNotes: "" };
  switch (resource) {
    case "sources": return { name: "", url: "", publisher: null, isOfficial: false, accessedAt: null, notes: null };
    case "pokemon": return { ...common, slug: "", name: "", nationalDexNumber: null, artworkUrl: null, primaryType: null, secondaryType: null, competitiveRole: null, strengths: [], weaknesses: [], availability: "UNVERIFIED", availableAt: null, availabilityNotes: null };
    case "forms": return { ...common, pokemonId: "", slug: "", name: "", primaryType: null, secondaryType: null };
    case "moves": return { ...common, slug: "", name: "", type: null, category: null, power: null, accuracy: null, priority: 0, effect: null, availability: "UNVERIFIED" };
    case "abilities": case "items": return { ...common, slug: "", name: "", effect: null, availability: "UNVERIFIED" };
    case "regulations": return { ...common, slug: "", name: "", format: "SINGLES", description: null, restrictions: null, teamSizeLimit: null, moveLimit: null, startsAt: null, endsAt: null, isCurrent: false, pokemon: [], moves: [], abilities: [], items: [] };
    case "tier-lists": return { ...common, regulationId: "", format: "SINGLES", name: "", publishedAt: null, entries: [] };
    case "statistics": return { ...common, pokemonId: "", regulationId: "", format: "SINGLES", sampleSize: null, usageRate: null, winRate: null, recordedAt: new Date().toISOString() };
    case "users": return { name: null, username: null, email: "", password: "", role: "USER", status: "ACTIVE" };
    case "verifications": return { entityType: "", entityId: "", sourceId: "", status: "UNVERIFIED", checkedAt: new Date().toISOString(), notes: null };
    case "community-lists": case "comments": return { moderationStatus: "HIDDEN", reason: "" };
  }
}

function titleOf(record: RecordValue) {
  return String(record.name ?? record.title ?? record.email ?? record.entityType ?? record.content ?? record.id);
}

function statusOf(record: RecordValue) {
  return record.moderationStatus ?? record.verificationStatus ?? record.status ?? record.availability ?? record.role;
}

function displayPayload(resource: AdminResource, record: RecordValue) {
  if (resource === "community-lists" || resource === "comments") return { moderationStatus: record.moderationStatus ?? "PUBLISHED", reason: "" };
  if (resource === "users") return { name: record.name, username: record.username, email: record.email, role: record.role, status: record.status };
  if (resource === "sources") return { name: record.name, url: record.url, publisher: record.publisher, isOfficial: record.isOfficial, accessedAt: record.accessedAt, notes: record.notes };
  if (resource === "verifications") return { entityType: record.entityType, entityId: record.entityId, sourceId: record.sourceId, status: record.status, checkedAt: record.checkedAt, notes: record.notes };
  if (resource === "pokemon") {
    const availability = record.availability as Record<string, unknown> | null | undefined;
    return {
      slug: record.slug,
      name: record.name,
      nationalDexNumber: record.nationalDexNumber,
      artworkUrl: record.artworkUrl,
      primaryType: record.primaryType,
      secondaryType: record.secondaryType,
      competitiveRole: record.competitiveRole,
      strengths: record.strengths ?? [],
      weaknesses: record.weaknesses ?? [],
      availability: availability?.status ?? "UNVERIFIED",
      availableAt: availability?.availableAt ?? null,
      availabilityNotes: availability?.notes ?? null,
      verificationStatus: record.verificationStatus ?? "UNVERIFIED",
      verificationNotes: "",
    };
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(template(resource))) if (key !== "sourceId" && key in record) result[key] = record[key];
  result.verificationStatus = record.verificationStatus ?? "UNVERIFIED";
  result.verificationNotes = "";
  return result;
}

export function AdminDataConsole() {
  const [resource, setResource] = useState<AdminResource>("sources");
  const [records, setRecords] = useState<RecordValue[]>([]);
  const [references, setReferences] = useState<References>({ pokemon: [], regulations: [], sources: [], moves: [], abilities: [], items: [] });
  const [selectedSource, setSelectedSource] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payload, setPayload] = useState(() => JSON.stringify(template("sources"), null, 2));
  const [message, setMessage] = useState("Loading admin data…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (nextResource: AdminResource, signal?: AbortSignal) => {
    const [recordsResponse, referencesResponse] = await Promise.all([fetch(`/api/admin/data/${nextResource}`, { cache: "no-store", signal }), fetch("/api/admin/references", { cache: "no-store", signal })]);
    const recordsBody = await recordsResponse.json().catch(() => ({})); const referencesBody = await referencesResponse.json().catch(() => ({}));
    if (signal?.aborted) return;
    if (!recordsResponse.ok) { setMessage(recordsBody.error ?? "Unable to load records."); return; }
    setRecords(recordsBody.data ?? []); if (referencesResponse.ok) setReferences(referencesBody.data);
    setMessage(`${(recordsBody.data ?? []).length} record${(recordsBody.data ?? []).length === 1 ? "" : "s"}`);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(resource, controller.signal)).catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Unable to load admin data."); });
    return () => controller.abort();
  }, [load, resource]);

  function chooseResource(next: AdminResource) {
    setResource(next); setEditingId(null); setPayload(JSON.stringify(template(next), null, 2)); setMessage("Loading…");
  }

  async function save() {
    if (moderation.has(resource) && !editingId) { setMessage("Choose an existing record to moderate."); return; }
    let body: Record<string, unknown>;
    try { body = JSON.parse(payload) as Record<string, unknown>; } catch { setMessage("Payload must be valid JSON."); return; }
    if (sourced.has(resource)) {
      if (!selectedSource) { setMessage("Choose a verification source first."); return; }
      body.sourceId = selectedSource;
    }
    setBusy(true); setMessage(editingId ? "Saving changes…" : "Creating record…");
    const response = await fetch(`/api/admin/data/${resource}${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { const detail = Array.isArray(result.issues) ? result.issues.map((issue: { message?: string }) => issue.message).filter(Boolean).join("; ") : ""; setMessage(detail || result.error || "Operation failed."); return; }
    setEditingId(null); setPayload(JSON.stringify(template(resource), null, 2)); await load(resource); setMessage("Saved and added to the audit log.");
  }

  async function remove(record: RecordValue) {
    if (!window.confirm(`Delete or remove “${titleOf(record)}”? This operation is audited.`)) return;
    setBusy(true); const response = await fetch(`/api/admin/data/${resource}/${record.id}`, { method: "DELETE" }); const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "Delete failed."); return; }
    if (editingId === record.id) { setEditingId(null); setPayload(JSON.stringify(template(resource), null, 2)); }
    await load(resource); setMessage(moderation.has(resource) ? "Content marked as removed and audited." : "Record deleted and audited.");
  }

  function edit(record: RecordValue) { setEditingId(record.id); setPayload(JSON.stringify(displayPayload(resource, record), null, 2)); setMessage(`Editing ${titleOf(record)}`); }
  const active = useMemo(() => sections.find((section) => section.resource === resource)!, [resource]);
  const ActiveIcon = active.icon;

  return <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
    <nav className="surface h-fit p-3" aria-label="Admin data sections">{sections.map(({ resource: key, label, icon: Icon }) => <button key={key} type="button" onClick={() => chooseResource(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${resource === key ? "bg-violet-500/15 text-violet-100" : "muted hover:bg-white/5 hover:text-white"}`}><Icon size={16}/>{label}</button>)}</nav>
    <div className="min-w-0 space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Validated operations</p><h2 className="mt-2 flex items-center gap-2 text-xl font-bold"><ActiveIcon size={20}/>{active.label}</h2><p className="muted mt-2 max-w-2xl text-sm">Every mutation is authorized from the database, validated with Zod, and written to the change log. Sourced domains also create a verification record.</p></div><Badge tone={moderation.has(resource) ? "warning" : "success"}>{editingId ? "Editing" : moderation.has(resource) ? "Moderation" : "Create"}</Badge></div>
        {sourced.has(resource) && <label className="mt-5 block"><span className="label">Verification source</span><select className="input" value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}><option value="">Select an existing source</option>{references.sources.map((source) => <option value={source.id} key={source.id}>{source.name} — {source.url}</option>)}</select></label>}
        <label className="mt-5 block"><span className="label">Validated JSON payload</span><textarea className="input min-h-80 resize-y py-3 font-mono text-xs leading-6" spellCheck={false} value={payload} onChange={(event) => setPayload(event.target.value)}/></label>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={() => void save()} className="button button-primary disabled:opacity-50">{editingId ? "Save changes" : moderation.has(resource) ? "Apply moderation" : "Create record"}</button>{editingId && <button type="button" className="button button-secondary" onClick={() => { setEditingId(null); setPayload(JSON.stringify(template(resource), null, 2)); }}>Cancel</button>}<p className="muted text-sm" aria-live="polite">{message}</p></div>
      </Card>
      <ReferencePanel references={references}/>
      <Card className="overflow-hidden"><div className="border-b px-5 py-4"><h3 className="font-bold">Existing {active.label.toLowerCase()}</h3></div>{records.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Record</th><th>Status</th><th>ID</th><th>Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td className="max-w-xs truncate font-medium">{titleOf(record)}</td><td>{statusOf(record) ? <Badge tone={String(statusOf(record)).includes("UNVER") || String(statusOf(record)) === "HIDDEN" ? "warning" : "default"}>{String(statusOf(record))}</Badge> : "—"}</td><td className="font-mono text-xs text-slate-400">{record.id}</td><td><div className="flex gap-2"><button className="button button-secondary min-h-8 px-3" type="button" onClick={() => edit(record)}>Edit</button><button className="button min-h-8 border border-rose-400/20 bg-rose-400/10 px-3 text-rose-200" disabled={busy} type="button" onClick={() => void remove(record)}>{moderation.has(resource) ? "Remove" : "Delete"}</button></div></td></tr>)}</tbody></table></div> : <p className="muted p-8 text-center text-sm">No records. This console never inserts artificial seed data.</p>}</Card>
    </div>
  </div>;
}

function ReferencePanel({ references }: { references: References }) {
  const groups: [string, Reference[]][] = [["Pokémon", references.pokemon], ["Regulations", references.regulations], ["Moves", references.moves], ["Abilities", references.abilities], ["Items", references.items]];
  return <details className="surface p-5"><summary className="cursor-pointer font-bold">Reference IDs for relational payloads</summary><p className="muted mt-2 text-sm">Copy exact database IDs; no catalog data is inferred or imported.</p><div className="mt-4 grid gap-4 md:grid-cols-2">{groups.map(([label, values]) => <div key={label}><h4 className="text-sm font-semibold">{label}</h4><div className="mt-2 max-h-40 overflow-auto rounded-xl border bg-black/20 p-3">{values.length ? values.map((value) => <p className="mb-2 text-xs" key={value.id}><span>{value.name}</span><br/><code className="text-cyan-300">{value.id}</code></p>) : <p className="muted text-xs">No records</p>}</div></div>)}</div></details>;
}
