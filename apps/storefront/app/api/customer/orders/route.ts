import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({ addressId: z.string().uuid(), checkoutKey: z.string().uuid(), couponCode: z.string().trim().max(32).optional() });

export async function GET() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await client.from("orders")
    .select("id,order_number,status,payment_status,currency,grand_total,placed_at,created_at,order_items(id,product_title,variant_title,seller_name,product_image_url,quantity,unit_price,line_total,fulfillment_status),shipment_packages(id,package_number,carrier_name,tracking_number,tracking_url,status,estimated_delivery_at,shipped_at,delivered_at,shipment_events(status,description,location,event_at))")
    .eq("customer_user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Siparişler alınamadı." }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sipariş için giriş yapmalısınız." }, { status: 401 });
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Teslimat adresini kontrol edin." }, { status: 400 });
  const { data, error } = await client.rpc("create_order_from_cart", { p_address_id: parsed.data.addressId, p_checkout_key: parsed.data.checkoutKey, p_coupon_code: parsed.data.couponCode || null });
  if (error) {
    const message = error.message || "";
    const unavailable = message.includes("insufficient_inventory") || message.includes("cart_contains_unavailable_product");
    const empty = message.includes("active_cart_not_found") || message.includes("selected_cart_empty");
    return NextResponse.json({ error: unavailable ? "Sepetteki bir ürünün stoğu veya satış durumu değişti." : empty ? "Sipariş oluşturulacak seçili ürün bulunamadı." : "Sipariş oluşturulamadı." }, { status: unavailable || empty ? 409 : 500 });
  }
  return NextResponse.json({ order: data }, { status: 201 });
}
