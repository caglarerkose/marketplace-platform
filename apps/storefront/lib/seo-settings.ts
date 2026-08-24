import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export type SeoSettings = {
  site_name: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  index_enabled: boolean;
  og_title: string;
  og_description: string;
  search_verification: string | null;
};
export async function getSeoSettings(): Promise<SeoSettings | null> {
  const client = await createSupabaseServerClient(),
    { data } = await client
      .from("storefront_seo_settings")
      .select(
        "site_name,meta_title,meta_description,keywords,index_enabled,og_title,og_description,search_verification",
      )
      .eq("id", true)
      .maybeSingle();
  return data as SeoSettings | null;
}
