import { notFound } from "next/navigation";
import Link from "next/link";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { CommunityActions } from "@/components/community-actions";
import { Badge, Card, PageHeading } from "@/components/ui";
import { displayTier } from "@/lib/utils";

export default async function CommunityDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) notFound();
  const list = await db().communityTierList.findFirst({
    where: { slug, isPublic: true, moderationStatus: "PUBLISHED" },
    include: {
      author: { select: { name: true, username: true } }, regulation: { select: { name: true } },
      entries: { orderBy: { ranking: "asc" }, include: { pokemon: { select: { name: true, slug: true, availability: { select: { status: true } } } } } },
      votes: { select: { value: true } }, comments: { where: { parentId: null, moderationStatus: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 50, include: { author: { select: { name: true, username: true } } } },
    },
  });
  if (!list) notFound();
  const score = list.votes.reduce((total, vote) => total + (vote.value === "UP" ? 1 : -1), 0);
  return <><PageHeading eyebrow="Community ranking" title={list.title} description={`${list.regulation.name} · ${list.format} · by ${list.author.name||list.author.username||"Trainer"}`}/><div className="mb-5 flex gap-3"><Badge tone="warning">Community</Badge><Badge>Score {score}</Badge></div><div className="space-y-3">{list.entries.filter(entry=>entry.pokemon.availability?.status==="AVAILABLE").map(entry=><Card key={entry.id} className="flex items-center gap-4 p-4"><span className="grid h-12 w-16 place-items-center rounded-xl bg-violet-500/10 font-black text-violet-200">{displayTier(entry.tier)}</span><div><Link className="font-bold hover:text-cyan-300" href={`/pokemon/${entry.pokemon.slug}`}>{entry.pokemon.name}</Link>{entry.explanation&&<p className="muted mt-1 text-sm">{entry.explanation}</p>}</div></Card>)}</div><div className="mt-6"><CommunityActions id={list.id}/></div><Card className="mt-5 p-6"><h2 className="font-bold">Discussion</h2>{list.comments.length?<div className="mt-4 space-y-4">{list.comments.map(comment=><div key={comment.id} className="border-b pb-4 last:border-0"><p className="text-sm">{comment.content}</p><p className="muted mt-2 text-xs">{comment.author.name||comment.author.username||"Trainer"} · {comment.createdAt.toLocaleDateString()}</p></div>)}</div>:<p className="muted mt-3 text-sm">No comments yet.</p>}</Card></>;
}
