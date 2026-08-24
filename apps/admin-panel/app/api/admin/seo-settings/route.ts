import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const schema = z.object({
  siteName: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().max(40),
  contactEmail: z.string().trim().email().max(254),
  legalName: z.string().trim().max(180),
  registrationNumber: z.string().trim().max(80),
  address: z.string().trim().max(500),
  metaTitle: z.string().trim().min(3).max(160),
  metaDescription: z.string().trim().min(10).max(500),
  keywords: z.string().trim().max(500),
  indexEnabled: z.boolean(),
  ogTitle: z.string().trim().min(2).max(160),
  ogDescription: z.string().trim().min(3).max(500),
  searchVerification: z.string().trim().max(500),
});
export async function GET() {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor)
    return NextResponse.json(
      { error: "SEO ayarlarını görüntüleme yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const { data, error } = await createSupabaseAdminClient()
    .from("storefront_seo_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return error
    ? NextResponse.json({ error: "SEO ayarları alınamadı." }, { status: 500 })
    : NextResponse.json({ settings: data });
}
export async function PUT(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor)
    return NextResponse.json(
      { error: "SEO ayarlarını güncelleme yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "SEO alanlarını kontrol edin." },
      { status: 400 },
    );
  const v = parsed.data,
    admin = createSupabaseAdminClient(),
    { error } = await admin.from("storefront_seo_settings").upsert({
      id: true,
      site_name: v.siteName,
      contact_phone: v.contactPhone || null,
      contact_email: v.contactEmail,
      legal_name: v.legalName || null,
      registration_number: v.registrationNumber || null,
      address: v.address || null,
      meta_title: v.metaTitle,
      meta_description: v.metaDescription,
      keywords: v.keywords
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      index_enabled: v.indexEnabled,
      og_title: v.ogTitle,
      og_description: v.ogDescription,
      search_verification: v.searchVerification || null,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    });
  if (error)
    return NextResponse.json(
      { error: "SEO ayarları kaydedilemedi." },
      { status: 409 },
    );
  await admin
    .from("admin_audit_logs")
    .insert({
      actor_user_id: actor.userId,
      actor_user_code: actor.userCode,
      action: "SEO ve site bilgileri yayınlandı",
      module: "SEO / Sayfalar",
      entity_type: "storefront_seo_settings",
      risk: "info",
      details: { index_enabled: v.indexEnabled },
    });
  return NextResponse.json({ ok: true });
}
