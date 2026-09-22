import { CatalogPage } from "@/components/catalog-page";
export default async function AbilitiesPage({searchParams}:{searchParams:Promise<{q?:string;selected?:string}>}){const{q,selected}=await searchParams;return <CatalogPage kind="ability" title="Ability database" description="Verified effects and compatible Pokémon, kept separate from regulation legality." query={q} selected={selected}/>}
