import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  warehouseId: z.string().uuid(), offerId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(100000000),
  reason: z.string().trim().min(3).max(500),
});

async function inventoryContext() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: seller } = await admin.from("sellers").select("id,status").eq("owner_user_id", user.id).maybeSingle();
  if (!seller || seller.status !== "active") return null;
  const { data: store } = await admin.from("stores").select("id").eq("seller_id", seller.id).eq("status", "active").maybeSingle();
  return store ? { admin, userId: user.id, storeId: store.id } : null;
}

export async function GET() {
  const context = await inventoryContext();
  if (!context) return NextResponse.json({ error: "Aktif mağaza oturumu bulunamadı." }, { status: 403 });
  const { data, error } = await context.admin.from("inventory_balances")
    .select("warehouse_id,offer_id,on_hand,reserved,available,updated_at,warehouses!inner(name,store_id),seller_offers!inner(seller_sku,status,product_variants!inner(title,catalog_products!inner(title)))")
    .eq("warehouses.store_id", context.storeId).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Stok bilgileri alınamadı." }, { status: 500 });
  return NextResponse.json({ inventory: data || [] });
}

export async function PATCH(request: Request) {
  const context = await inventoryContext();
  if (!context) return NextResponse.json({ error: "Aktif mağaza oturumu bulunamadı." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Stok güncelleme bilgilerini kontrol edin." }, { status: 400 });
  const { data, error } = await context.admin.rpc("adjust_store_inventory", {
    p_actor_user_id: context.userId, p_warehouse_id: parsed.data.warehouseId,
    p_offer_id: parsed.data.offerId, p_new_on_hand: parsed.data.quantity, p_reason: parsed.data.reason,
  });
  if (error) {
    const reserved = error.message.includes("stock_below_reserved");
    return NextResponse.json({ error: reserved ? "Stok, ayrılmış ürün adedinin altına indirilemez." : "Stok güncellenemedi." }, { status: reserved ? 409 : 500 });
  }
  return NextResponse.json({ ok: true, balance: data?.[0] });
}
