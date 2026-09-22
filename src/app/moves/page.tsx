import { CatalogPage } from "@/components/catalog-page";
export default async function MovesPage({searchParams}:{searchParams:Promise<{q?:string;selected?:string}>}){const{q,selected}=await searchParams;return <CatalogPage kind="move" title="Move database" description="Verified move properties, learnsets, and regulation legality for Pokémon Champions." query={q} selected={selected}/>}
