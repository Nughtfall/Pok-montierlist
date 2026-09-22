import { CatalogPage } from "@/components/catalog-page";
export default async function ItemsPage({searchParams}:{searchParams:Promise<{q?:string;selected?:string}>}){const{q,selected}=await searchParams;return <CatalogPage kind="item" title="Item database" description="Verified held items and legality for Pokémon Champions competitive play." query={q} selected={selected}/>}
