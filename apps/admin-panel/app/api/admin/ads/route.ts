import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
const schema = z
  .object({
    title: z.string().trim().min(2).max(160),
    placement: z.enum([
      "home_promo",
      "category_list",
      "product_detail",
      "storefront",
    ]),
    sponsorName: z.string().trim().min(2).max(160),
    target: z.string().trim().min(1).max(500),
    label: z.enum(["SPONSORLU", "REKLAM", "FIRSAT", "ÖNE ÇIKAN"]),
    theme: z.enum(["orange", "dark", "blue", "green"]),
    body: z.string().trim().min(3).max(500),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    status: z.enum(["active", "scheduled", "passive"]),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "Bitiş tarihi başlangıçtan sonra olmalıdır.",
  });
export async function GET() {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor)
    return NextResponse.json(
      { error: "Reklam görüntüleme yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const { data, error } = await createSupabaseAdminClient()
    .from("ad_placements")
    .select("*")
    .order("created_at", { ascending: false });
  return error
    ? NextResponse.json({ error: "Reklamlar alınamadı." }, { status: 500 })
    : NextResponse.json({ ads: data || [] });
}
export async function POST(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor)
    return NextResponse.json(
      { error: "Reklam yayınlama yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message || "Reklam bilgilerini kontrol edin.",
      },
      { status: 400 },
    );
  const v = parsed.data,
    { error } = await createSupabaseAdminClient()
      .from("ad_placements")
      .insert({
        title: v.title,
        placement: v.placement,
        sponsor_name: v.sponsorName,
        target: v.target,
        label: v.label,
        theme: v.theme,
        body: v.body,
        starts_at: v.startsAt,
        ends_at: v.endsAt,
        status: v.status,
        created_by: actor.userId,
      });
  return error
    ? NextResponse.json({ error: "Reklam kaydedilemedi." }, { status: 409 })
    : NextResponse.json({ ok: true }, { status: 201 });
}
export async function DELETE(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor)
    return NextResponse.json(
      { error: "Reklam yönetimi yetkiniz bulunmuyor." },
      { status: 403 },
    );
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Reklam bulunamadı." }, { status: 400 });
  const { error } = await createSupabaseAdminClient()
    .from("ad_placements")
    .delete()
    .eq("id", id);
  return error
    ? NextResponse.json({ error: "Reklam silinemedi." }, { status: 409 })
    : NextResponse.json({ ok: true });
}
