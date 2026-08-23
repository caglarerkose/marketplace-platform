import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase/server";

const schema = z.object({ questionId: z.string().uuid(), answer: z.string().trim().min(1).max(2000) });

export async function GET() {
  const client = await createAuthServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await client.from("product_questions").select("id,question,answer,status,created_at,catalog_products(title),stores(name)").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Müşteri soruları alınamadı." }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}

export async function PATCH(request: Request) {
  const client = await createAuthServerClient();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Yanıt bilgilerini kontrol edin." }, { status: 400 });
  const { error } = await client.rpc("answer_product_question", { p_question_id: parsed.data.questionId, p_answer: parsed.data.answer });
  if (error) return NextResponse.json({ error: "Soru yanıtlanamadı." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
