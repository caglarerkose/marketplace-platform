import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export type StorefrontAd = {
  id: string;
  title: string;
  sponsor_name: string;
  target: string;
  label: string;
  theme: string;
  body: string;
};
export async function getActiveAd(
  placement: string,
): Promise<StorefrontAd | null> {
  const client = await createSupabaseServerClient(),
    now = new Date().toISOString(),
    { data } = await client
      .from("ad_placements")
      .select("id,title,sponsor_name,target,label,theme,body")
      .eq("placement", placement)
      .eq("status", "active")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  return data as StorefrontAd | null;
}
