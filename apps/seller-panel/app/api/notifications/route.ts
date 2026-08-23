import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase/server";

const schema = z.object({ notificationId: z.string().uuid().nullable().optional() });

export async function GET() {
  const client = await createAuthServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await client.from("user_notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).eq("panel", "seller").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Bildirimler alınamadı." }, { status: 500 });
  return NextResponse.json({ notifications: data || [], unread: (data || []).filter((item) => !item.read_at).length });
}

export async function PATCH(request: Request) {
  const client = await createAuthServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "İşlem geçersiz." }, { status: 400 });
  const { error } = await client.rpc("mark_notification_read", { p_notification_id: parsed.data.notificationId || null });
  if (error) return NextResponse.json({ error: "Bildirim güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
