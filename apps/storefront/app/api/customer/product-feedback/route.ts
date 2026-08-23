import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const questionSchema = z.object({ offerId: z.string().uuid(), question: z.string().trim().min(5).max(1000) });
const reviewSchema = z.object({ orderItemId: z.string().uuid(), rating: z.number().int().min(1).max(5), title: z.string().trim().max(160).optional(), body: z.string().trim().max(2000).optional() });

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Ürün gerekli." }, { status: 400 });
  const client = await createSupabaseServerClient();
  const [questions, reviews] = await Promise.all([
    client.from("product_questions").select("id,question,answer,answered_at,created_at,stores(name)").eq("product_id", productId).eq("status", "published").order("created_at", { ascending: false }),
    client.from("product_reviews").select("id,rating,title,body,created_at").eq("product_id", productId).eq("status", "published").order("created_at", { ascending: false }),
  ]);
  if (questions.error || reviews.error) return NextResponse.json({ error: "Ürün içerikleri alınamadı." }, { status: 500 });
  return NextResponse.json({ questions: questions.data || [], reviews: reviews.data || [] });
}

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Soru sormak veya değerlendirme yapmak için giriş yapın." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.type === "question") {
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Sorunuzu kontrol edin." }, { status: 400 });
    const { data, error } = await client.rpc("create_product_question", { p_offer_id: parsed.data.offerId, p_question: parsed.data.question });
    if (error) return NextResponse.json({ error: "Sorunuz gönderilemedi." }, { status: 400 });
    return NextResponse.json({ id: data }, { status: 201 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Değerlendirme bilgilerini kontrol edin." }, { status: 400 });
  const { data, error } = await client.rpc("create_product_review", { p_order_item_id: parsed.data.orderItemId, p_rating: parsed.data.rating, p_title: parsed.data.title || null, p_body: parsed.data.body || null });
  if (error) return NextResponse.json({ error: error.message.includes("already") ? "Bu ürünü daha önce değerlendirdiniz." : "Yalnızca teslim edilmiş ürünler değerlendirilebilir." }, { status: 400 });
  return NextResponse.json({ id: data }, { status: 201 });
}
