import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({ className,...props }:HTMLAttributes<HTMLDivElement>) { return <div className={cn("surface",className)} {...props}/>; }
export function Badge({ children,tone="default" }:{children:ReactNode;tone?:"default"|"success"|"warning"}) { return <span className={cn("badge",tone==="success"&&"badge-success",tone==="warning"&&"badge-warning")}>{children}</span>; }
export function ButtonLink({ href,children,secondary=false }:{href:string;children:ReactNode;secondary?:boolean}) { return <Link href={href} className={cn("button",secondary?"button-secondary":"button-primary")}>{children}</Link>; }
export function PageHeading({ eyebrow,title,description,action }:{eyebrow?:string;title:string;description:string;action?:ReactNode}) { return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl">{eyebrow&&<p className="eyebrow mb-3">{eyebrow}</p>}<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="muted mt-3 max-w-2xl leading-7">{description}</p></div>{action}</div>; }
export function EmptyState({ title,description,action }:{title:string;description:string;action?:ReactNode}) { return <div className="empty"><div className="mx-auto mb-4 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_24px_8px_rgba(34,211,238,.2)]"/><h2 className="text-lg font-semibold">{title}</h2><p className="muted mx-auto mt-2 max-w-xl text-sm leading-6">{description}</p>{action&&<div className="mt-6">{action}</div>}</div>; }
