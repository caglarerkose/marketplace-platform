import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ announcementId: z.string().uuid() });

export async function GET() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.from("platform_announcements")
    .select("id,title,body,priority,link,starts_at")
    .in("audience", ["all", "storefront"]).eq("status", "published")
    .lte("starts_at", new Date().toISOString()).order("starts_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Duyurular alınamadı." }, { status: 500 });
  let readIds = new Set<string>();
  if (user && data?.length) {
    const { data: reads } = await client.from("announcement_reads").select("announcement_id")
      .eq("user_id", user.id).in("announcement_id", data.map(item => item.id));
    readIds = new Set((reads || []).map(item => item.announcement_id));
  }
  return NextResponse.json({ announcements: (data || []).map(item => ({ ...item, read: readIds.has(item.id) })) });
}

export async function PATCH(request: Request) {
  const client = await createSupabaseServerClient();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "İşlem geçersiz." }, { status: 400 });
  const { error } = await client.rpc("mark_announcement_read", { p_announcement_id: parsed.data.announcementId });
  if (error) return NextResponse.json({ error: "Duyuru güncellenemedi." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
