import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const item = z.object({
  label: z.string().trim().min(1).max(30),
  target: z
    .string()
    .trim()
    .regex(/^\/(?!\/)[a-zA-Z0-9/?=&_-]*$/),
  icon: z.enum([
    "fa-house",
    "fa-magnifying-glass",
    "fa-heart",
    "fa-cart-shopping",
    "fa-user",
    "fa-bell",
    "fa-bullhorn",
    "fa-store",
  ]),
  sortOrder: z.number().int().min(1).max(20),
  enabled: z.boolean(),
});
const schema = z.object({
  appMode: z.enum(["pwa", "hybrid", "mobile_web"]),
  categoryView: z.enum(["square_grid", "horizontal_list", "compact_list"]),
  productCardView: z.enum(["compact", "marketplace", "image_first"]),
  purchaseBarEnabled: z.boolean(),
  campaignBannerEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  homeBlockOrder: z
    .array(
      z.enum([
        "slider",
        "campaign",
        "approved_products",
        "advertisement",
        "products",
      ]),
    )
    .min(1),
  mobileMessage: z.string().trim().max(300),
  navigationItems: z.array(item).min(1).max(5),
});
export async function GET() {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor)
    return NextResponse.json(
      { error: "Mobil ayarları görüntüleme yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const { data, error } = await createSupabaseAdminClient()
    .from("mobile_storefront_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return error
    ? NextResponse.json({ error: "Mobil ayarlar alınamadı." }, { status: 500 })
    : NextResponse.json({ settings: data });
}
export async function PUT(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor)
    return NextResponse.json(
      { error: "Mobil ayarları güncelleme yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Mobil ayar alanlarını kontrol edin." },
      { status: 400 },
    );
  const v = parsed.data,
    { error } = await createSupabaseAdminClient()
      .from("mobile_storefront_settings")
      .upsert({
        id: true,
        app_mode: v.appMode,
        category_view: v.categoryView,
        product_card_view: v.productCardView,
        purchase_bar_enabled: v.purchaseBarEnabled,
        campaign_banner_enabled: v.campaignBannerEnabled,
        push_enabled: v.pushEnabled,
        home_block_order: v.homeBlockOrder,
        mobile_message: v.mobileMessage || null,
        navigation_items: v.navigationItems,
        updated_by: actor.userId,
        updated_at: new Date().toISOString(),
      });
  return error
    ? NextResponse.json(
        { error: "Mobil ayarlar kaydedilemedi." },
        { status: 409 },
      )
    : NextResponse.json({ ok: true });
}
