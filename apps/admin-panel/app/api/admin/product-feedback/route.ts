import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ contentType: z.enum(["question", "review"]), contentId: z.string().uuid(), decision: z.enum(["published", "rejected"]), note: z.string().trim().max(1000).optional() });

export async function GET() {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) return NextResponse.json({ error: "İçerik onay yetkiniz bulunmuyor." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const [questions, reviews] = await Promise.all([
    admin.from("product_questions").select("id,question,answer,status,created_at,catalog_products(title),stores(name)").eq("status", "pending").order("created_at", { ascending: true }),
    admin.from("product_reviews").select("id,rating,title,body,status,created_at,catalog_products(title),stores(name)").eq("status", "pending").order("created_at", { ascending: true }),
  ]);
  if (questions.error || reviews.error) return NextResponse.json({ error: "İçerik onay kuyruğu alınamadı." }, { status: 500 });
  return NextResponse.json({ questions: questions.data || [], reviews: reviews.data || [] });
}

export async function PATCH(request: Request) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) return NextResponse.json({ error: "İçerik onay yetkiniz bulunmuyor." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Karar bilgilerini kontrol edin." }, { status: 400 });
  const client = await createSupabaseServerClient();
  const { error } = await client.rpc("moderate_product_content", { p_content_type: parsed.data.contentType, p_content_id: parsed.data.contentId, p_decision: parsed.data.decision, p_note: parsed.data.note || null });
  if (error) return NextResponse.json({ error: "İçerik kararı kaydedilemedi." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
