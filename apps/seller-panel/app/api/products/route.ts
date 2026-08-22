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
  listPrice: z.coerce.number().positive().max(999999999999).optional(),
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
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
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
  return NextResponse.json({ ok: true, product: data?.[0] }, { status: 201 });
}
