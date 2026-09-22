"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export function CommunityActions({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function vote(value: "UP" | "DOWN") {
    const response = await fetch(`/api/community/${id}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value }) });
    setMessage(response.ok ? "Vote recorded" : response.status === 401 ? "Sign in to vote" : "Vote failed");
    if (response.ok) router.refresh();
  }
  async function comment(formData: FormData) {
    const response = await fetch(`/api/community/${id}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: formData.get("content") }) });
    setMessage(response.ok ? "Comment posted" : response.status === 401 ? "Sign in to comment" : "Comment failed");
    if (response.ok) router.refresh();
  }
  return <div className="surface p-5"><div className="flex gap-2"><button className="button button-secondary" onClick={()=>vote("UP")}><ThumbsUp size={15}/>Upvote</button><button className="button button-secondary" onClick={()=>vote("DOWN")}><ThumbsDown size={15}/>Downvote</button></div><form action={comment} className="mt-4 flex gap-2"><input name="content" className="input" required maxLength={2000} placeholder="Add to the discussion…"/><button className="button button-primary">Post</button></form><p className="muted mt-2 text-xs" aria-live="polite">{message}</p></div>;
}
