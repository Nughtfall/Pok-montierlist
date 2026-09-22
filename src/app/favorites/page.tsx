import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { FavoriteButton } from "@/components/favorite-button";
import { Card,EmptyState,PageHeading } from "@/components/ui";
export default async function Favorites(){const session=await auth();if(!session?.user?.id||session.user.status!=="ACTIVE")redirect("/login");const favorites=await db().favorite.findMany({where:{userId:session.user.id,pokemon:{availability:{status:"AVAILABLE"}}},include:{pokemon:true},orderBy:{createdAt:"desc"}});return <><PageHeading eyebrow="Saved references" title="Favorites" description="Your bookmarked, currently available Pokémon Champions entries."/>{favorites.length?<div className="grid-auto">{favorites.map(x=><Card key={x.id} className="surface-hover p-5"><Link className="font-bold hover:text-cyan-300" href={`/pokemon/${x.pokemon.slug}`}>{x.pokemon.name}</Link><div className="mt-4"><FavoriteButton pokemonId={x.pokemonId} initialFavorite/></div></Card>)}</div>:<EmptyState title="No favorites" description="Favorite actions become available on verified Pokémon records."/>}</>}
