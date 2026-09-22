import Link from "next/link";
import { Suspense } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { GlobalSearch } from "@/components/search";
import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";

export function Header(){return <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-white/[.06] bg-[#070a13]/90 px-4 backdrop-blur-xl sm:px-6"><div className="w-[220px]"><Logo/></div><div className="mx-auto w-full max-w-lg"><GlobalSearch/></div><div className="ml-4 flex w-[220px] justify-end"><Suspense fallback={<div className="h-9 w-24 rounded-xl border bg-white/[.03]"/>}><AccountMenu/></Suspense></div></header>}

async function AccountMenu(){const session=await auth();if(!session?.user?.id||session.user.status!=="ACTIVE")return <Link href="/login" className="button button-secondary !min-h-9 !px-3"><LogIn size={15}/> Sign in</Link>;return <details className="group relative"><summary className="button button-secondary !min-h-9 !px-3 list-none"><UserRound size={15}/><span className="hidden sm:inline">{session.user.name||"Account"}</span></summary><div className="absolute right-0 mt-2 w-52 rounded-xl border bg-[#0d111f] p-2 shadow-2xl"><AccountLink href="/my-teams">My teams</AccountLink><AccountLink href="/favorites">Favorites</AccountLink><AccountLink href="/my-tier-lists">My tier lists</AccountLink><AccountLink href="/profile">Profile</AccountLink>{session.user.role==="ADMIN"&&<AccountLink href="/admin">Admin</AccountLink>}<form action={logout} className="mt-1 border-t pt-1"><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-200 hover:bg-white/[.05]"><LogOut size={14}/>Sign out</button></form></div></details>}
function AccountLink({href,children}:{href:string;children:string}){return <Link href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/[.05] hover:text-white">{children}</Link>}
