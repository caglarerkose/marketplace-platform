import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveProducts } from "@/lib/catalog-products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("toggle_favorite"), productId: z.string().uuid().optional(), slug: z.string().min(1).optional() }).refine((value) => value.productId || value.slug),
  z.object({ action: z.literal("add_cart"), offerId: z.string().uuid() }),
  z.object({ action: z.literal("update_quantity"), offerId: z.string().uuid(), quantity: z.number().int().min(1).max(999) }),
  z.object({ action: z.literal("toggle_selected"), offerId: z.string().uuid(), selected: z.boolean() }),
  z.object({ action: z.literal("remove_cart"), offerId: z.string().uuid() }),
  z.object({ action: z.literal("select_all"), selected: z.boolean() }),
]);

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function session() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  return user ? { client, user } : null;
}

async function activeCart(client: Client, userId: string, create = false) {
  const { data } = await client.from("customer_carts").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (data || !create) return data?.id || null;
  const { data: created } = await client.from("customer_carts").insert({ user_id: userId, status: "active" }).select("id").single();
  return created?.id || null;
}

export async function GET() {
  const current = await session();
  if (!current) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const cartId = await activeCart(current.client, current.user.id);
  const products = await getActiveProducts();
  const cartRequest = cartId
    ? current.client.from("customer_cart_items").select("offer_id,quantity,is_selected").eq("cart_id", cartId)
    : Promise.resolve({ data: [] as { offer_id: string; quantity: number; is_selected: boolean }[] });
  const [{ data: cartRows }, { data: favorites }] = await Promise.all([
    cartRequest,
    current.client.from("customer_favorites").select("product_id").eq("user_id", current.user.id),
  ]);
  const byOffer = new Map(products.filter((product) => product.offerId).map((product) => [product.offerId!, product]));
  const byProduct = new Map(products.filter((product) => product.productId).map((product) => [product.productId!, product]));
  const favoriteProducts = (favorites || []).flatMap((row) => { const product = byProduct.get(row.product_id); return product ? [product] : []; });
  const cart = (cartRows || []).flatMap((row) => { const product = byOffer.get(row.offer_id); return product ? [{ product, quantity: row.quantity, selected: row.is_selected }] : []; });
  return NextResponse.json({ cart, favorites: favoriteProducts.map((product) => product.id), favoriteProducts });
}

export async function POST(request: Request) {
  const current = await session();
  if (!current) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Alışveriş işlemi geçersiz." }, { status: 400 });
  const input = parsed.data;

  if (input.action === "toggle_favorite") {
    let productId = input.productId;
    if (!productId && input.slug) productId = (await getActiveProducts()).find((item) => item.id === input.slug)?.productId;
    if (!productId) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    const { data: existing } = await current.client.from("customer_favorites").select("product_id").eq("user_id", current.user.id).eq("product_id", productId).maybeSingle();
    const { error } = existing
      ? await current.client.from("customer_favorites").delete().eq("user_id", current.user.id).eq("product_id", productId)
      : await current.client.from("customer_favorites").insert({ user_id: current.user.id, product_id: productId });
    if (error) return NextResponse.json({ error: "Favori işlemi kaydedilemedi." }, { status: 500 });
    return NextResponse.json({ ok: true, favorite: !existing });
  }

  const cartId = await activeCart(current.client, current.user.id, true);
  if (!cartId) return NextResponse.json({ error: "Sepet oluşturulamadı." }, { status: 500 });
  let error = null;
  if (input.action === "add_cart") {
    const { data: existing } = await current.client.from("customer_cart_items").select("quantity").eq("cart_id", cartId).eq("offer_id", input.offerId).maybeSingle();
    ({ error } = await current.client.from("customer_cart_items").upsert({ cart_id: cartId, offer_id: input.offerId, quantity: Math.min(999, (existing?.quantity || 0) + 1), is_selected: true }, { onConflict: "cart_id,offer_id" }));
  } else if (input.action === "update_quantity") {
    ({ error } = await current.client.from("customer_cart_items").update({ quantity: input.quantity }).eq("cart_id", cartId).eq("offer_id", input.offerId));
  } else if (input.action === "toggle_selected") {
    ({ error } = await current.client.from("customer_cart_items").update({ is_selected: input.selected }).eq("cart_id", cartId).eq("offer_id", input.offerId));
  } else if (input.action === "remove_cart") {
    ({ error } = await current.client.from("customer_cart_items").delete().eq("cart_id", cartId).eq("offer_id", input.offerId));
  } else {
    ({ error } = await current.client.from("customer_cart_items").update({ is_selected: input.selected }).eq("cart_id", cartId));
  }
  if (error) return NextResponse.json({ error: "Sepet işlemi kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
