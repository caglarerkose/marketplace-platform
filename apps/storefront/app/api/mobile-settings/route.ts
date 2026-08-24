import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET() {
  const client = await createSupabaseServerClient(),
    { data, error } = await client
      .from("mobile_storefront_settings")
      .select(
        "app_mode,category_view,product_card_view,purchase_bar_enabled,campaign_banner_enabled,push_enabled,home_block_order,mobile_message,navigation_items",
      )
      .eq("id", true)
      .maybeSingle();
  return error
    ? NextResponse.json({ error: "Mobil ayarlar alınamadı." }, { status: 500 })
    : NextResponse.json({ settings: data });
}
