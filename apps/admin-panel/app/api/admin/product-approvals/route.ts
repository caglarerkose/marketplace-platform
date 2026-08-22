import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) return NextResponse.json({ error: "Ürün onaylarını görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("seller_offers")
    .select("id,seller_sku,price,list_price,status,created_at,stores(id,name),product_variants!inner(id,title,sku,barcode,catalog_products!inner(id,title,description,status,created_at,categories(id,name)))")
    .eq("status", "pending").eq("product_variants.catalog_products.status", "pending")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Ürün onay kuyruğu alınamadı." }, { status: 500 });
  return NextResponse.json({ approvals: data || [] });
}
