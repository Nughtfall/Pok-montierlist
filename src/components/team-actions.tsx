"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeamActions({ id, isPublic, shareSlug }: { id: string; isPublic: boolean; shareSlug: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function act(method: "POST" | "DELETE") { const response = await fetch(`/api/teams/${id}`, { method }); if (response.ok) router.refresh(); }
  async function update(data: { name?: string; isPublic?: boolean }) {
    const response = await fetch(`/api/teams/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (!response.ok) return setMessage("Update failed");
    const team = (await response.json()).data;
    if (data.isPublic && team.shareSlug) {
      await navigator.clipboard.writeText(`${window.location.origin}/teams/${team.shareSlug}`);
      setMessage("Share link copied");
    } else setMessage(data.isPublic === false ? "Team is private" : "Renamed");
    router.refresh();
  }
  function rename() { const name = window.prompt("New team name"); if (name?.trim()) void update({ name }); }
  async function share() {
    if (isPublic && shareSlug) { await navigator.clipboard.writeText(`${window.location.origin}/teams/${shareSlug}`); setMessage("Share link copied"); }
    else await update({ isPublic: true });
  }
  return <div><div className="flex flex-wrap gap-2"><button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={rename}>Rename</button><button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={()=>act("POST")}>Duplicate</button><button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={share}>Share</button>{isPublic&&<button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={()=>update({isPublic:false})}>Make private</button>}<button className="button button-secondary !min-h-8 !px-3 text-xs text-rose-300" onClick={()=>act("DELETE")}>Delete</button></div><p className="muted mt-2 text-right text-[11px]" aria-live="polite">{message}</p></div>;
}
