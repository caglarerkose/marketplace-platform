import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ notificationId: z.string().uuid().nullable().optional() });

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from("user_notifications").select("id,title,body,link,read_at,created_at").eq("user_id", actor.userId).eq("panel", "admin").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Bildirimler alınamadı." }, { status: 500 });
  return NextResponse.json({ notifications: data || [], unread: (data || []).filter((item) => !item.read_at).length });
}

export async function PATCH(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "İşlem geçersiz." }, { status: 400 });
  const client = await createSupabaseServerClient();
  const { error } = await client.rpc("mark_notification_read", { p_notification_id: parsed.data.notificationId || null });
  if (error) return NextResponse.json({ error: "Bildirim güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
