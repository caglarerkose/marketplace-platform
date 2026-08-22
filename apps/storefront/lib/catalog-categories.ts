import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CatalogCategory={id:string;name:string;slug:string;imageUrl:string|null;parentId:string|null};
export async function getActiveCategories():Promise<CatalogCategory[]>{const client=await createSupabaseServerClient(),{data,error}=await client.from("categories").select("id,name,slug,image_url,parent_id").eq("status","active").order("sort_order").order("name");if(error)return[];return(data||[]).map(item=>({id:item.id,name:item.name,slug:item.slug,imageUrl:item.image_url,parentId:item.parent_id}))}
