"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommunityListActions({ id, slug, isPublic }: { id: string; slug: string; isPublic: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function visibility(next: boolean) {
    const response = await fetch(`/api/community/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isPublic: next }) });
    setMessage(response.ok ? next ? "Published" : "Made private" : "Update failed");
    if (response.ok) router.refresh();
  }
  async function share() {
    if (!isPublic) return visibility(true);
    await navigator.clipboard.writeText(`${window.location.origin}/community/${slug}`);
    setMessage("Share link copied");
  }
  async function remove() {
    if (!window.confirm("Delete this community tier list?")) return;
    const response = await fetch(`/api/community/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Deleted" : "Delete failed");
    if (response.ok) router.refresh();
  }
  return <div><div className="flex flex-wrap gap-2"><button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={() => router.push(`/my-tier-lists?edit=${id}`)}>Edit</button><button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={() => void share()}>Share</button>{isPublic && <button className="button button-secondary !min-h-8 !px-3 text-xs" onClick={() => void visibility(false)}>Make private</button>}<button className="button button-secondary !min-h-8 !px-3 text-xs text-rose-300" onClick={() => void remove()}>Delete</button></div><p className="muted mt-2 text-right text-[11px]" aria-live="polite">{message}</p></div>;
}
