import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { Badge,Card,PageHeading } from "@/components/ui";
export default async function Profile(){const session=await auth();if(!session?.user?.id||session.user.status!=="ACTIVE")redirect("/login");const user=await db().user.findUniqueOrThrow({where:{id:session.user.id},include:{_count:{select:{teams:true,favorites:true,tierLists:true,comments:true}}}});return <><PageHeading eyebrow="Account" title={user.name||user.username||"Trainer profile"} description="Manage your public identity and review your contribution overview."/><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><Card className="p-6"><Badge>{user.role}</Badge><p className="muted mt-4 text-sm">{user.email}</p><div className="grid grid-cols-2 gap-3 mt-7">{Object.entries(user._count).map(([label,value])=><div key={label} className="rounded-xl border p-4"><p className="muted text-xs capitalize">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}</div></Card><ProfileForm name={user.name??""} username={user.username??""}/></div></>}
