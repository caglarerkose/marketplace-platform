import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

const productSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(5000).optional(),
  variantTitle: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(2).max(80),
  barcode: z.string().trim().regex(/^\d{8,32}$/).optional().or(z.literal("")),
  price: z.coerce.number().positive().max(999999999999),
  listPrice: z.preprocess(value => value === "" || value === null ? undefined : value, z.coerce.number().positive().max(999999999999).optional()),
  initialStock: z.coerce.number().int().min(1).max(1000000),
}).refine((value) => !value.listPrice || value.listPrice >= value.price, {
  message: "Liste fiyatı satış fiyatından düşük olamaz.",
  path: ["listPrice"],
});

function slugify(value: string) {
  return value.toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i").replaceAll("ğ", "g").replaceAll("ü", "u")
    .replaceAll("ş", "s").replaceAll("ö", "o").replaceAll("ç", "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "urun";
}

async function sellerContext() {
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
  const context = await sellerContext();
  if (!context) return NextResponse.json({ error: "Aktif mağaza oturumu bulunamadı." }, { status: 403 });
  const { data, error } = await context.admin.from("seller_offers")
    .select("id,seller_sku,price,list_price,status,rejection_reason,updated_at,product_variants!inner(id,title,barcode,catalog_products!inner(id,title,status,rejection_reason,categories(name)))")
    .eq("store_id", context.storeId).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Ürünler alınamadı." }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: Request) {
  const context = await sellerContext();
  if (!context) return NextResponse.json({ error: "Aktif mağaza oturumu bulunamadı." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Ürün formu okunamadı." }, { status: 400 });
  const files = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!files.length || files.length > 6 || files.some(file => !allowed.has(file.type) || file.size > 5 * 1024 * 1024)) return NextResponse.json({ error: "En fazla 6 adet, görsel başına 5 MB JPG, PNG veya WEBP yükleyin." }, { status: 400 });
  const parsed = productSchema.safeParse(Object.fromEntries([...form.entries()].filter(([key]) => key !== "images")));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Ürün bilgilerini kontrol edin." }, { status: 400 });
  const slug = `${slugify(parsed.data.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await context.admin.rpc("create_seller_product_submission", {
    p_actor_user_id: context.userId, p_store_id: context.storeId, p_category_id: parsed.data.categoryId,
    p_title: parsed.data.title, p_description: parsed.data.description || "", p_slug: slug,
    p_variant_title: parsed.data.variantTitle, p_sku: parsed.data.sku, p_barcode: parsed.data.barcode || "",
    p_price: parsed.data.price, p_list_price: parsed.data.listPrice || null,
  });
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ error: duplicate ? "Bu SKU veya barkod daha önce kullanılmış." : "Ürün onaya gönderilemedi." }, { status: duplicate ? 409 : 500 });
  }
  const created = data?.[0];
  if (!created?.product_id || !created?.offer_id) return NextResponse.json({ error: "Ürün kaydı tamamlanamadı." }, { status: 500 });
  const uploaded: string[] = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index], extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg", path = `${context.storeId}/${created.product_id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await context.admin.storage.from("product-images").upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (uploadError) { await context.admin.storage.from("product-images").remove(uploaded); await context.admin.from("catalog_products").delete().eq("id", created.product_id); return NextResponse.json({ error: "Ürün fotoğrafları yüklenemedi." }, { status: 500 }); }
    uploaded.push(path);
    const { data: publicUrl } = context.admin.storage.from("product-images").getPublicUrl(path);
    const { error: mediaError } = await context.admin.from("product_media").insert({ product_id: created.product_id, media_type: "image", url: publicUrl.publicUrl, alt_text: parsed.data.title, sort_order: index, is_primary: index === 0 });
    if (mediaError) { await context.admin.storage.from("product-images").remove(uploaded); await context.admin.from("catalog_products").delete().eq("id", created.product_id); return NextResponse.json({ error: "Ürün görsel kaydı oluşturulamadı." }, { status: 500 }); }
  }
  let { data: warehouse } = await context.admin.from("warehouses").select("id").eq("store_id", context.storeId).eq("status", "active").order("created_at").limit(1).maybeSingle();
  if (!warehouse) { const result = await context.admin.from("warehouses").insert({ store_id: context.storeId, name: "Ana Depo", code: "ANA", status: "active" }).select("id").single(); warehouse = result.data; }
  if (!warehouse) { await context.admin.storage.from("product-images").remove(uploaded); await context.admin.from("catalog_products").delete().eq("id", created.product_id); return NextResponse.json({ error: "Ürün stoğu oluşturulamadı." }, { status: 500 }); }
  const { error: stockError } = await context.admin.from("inventory_balances").insert({ warehouse_id: warehouse.id, offer_id: created.offer_id, on_hand: parsed.data.initialStock });
  if (stockError) { await context.admin.storage.from("product-images").remove(uploaded); await context.admin.from("catalog_products").delete().eq("id", created.product_id); return NextResponse.json({ error: "Başlangıç stoğu kaydedilemedi." }, { status: 500 }); }
  return NextResponse.json({ ok: true, product: data?.[0] }, { status: 201 });
}
