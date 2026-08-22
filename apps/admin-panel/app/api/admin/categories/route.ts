import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(1000).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) {
    return NextResponse.json({ error: "Kategori görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("categories")
    .select("id,parent_id,name,slug,description,image_url,sort_order,status,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "Kategoriler alınamadı." }, { status: 500 });
  }

  const names = new Map((data || []).map((category) => [category.id, category.name]));
  return NextResponse.json({
    categories: (data || []).map((category) => ({
      ...category,
      parent_name: category.parent_id ? names.get(category.parent_id) || null : null,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) {
    return NextResponse.json({ error: "Kategori oluşturma yetkiniz bulunmuyor." }, { status: 403 });
  }
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kategori bilgileri geçersiz." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  if (parsed.data.parentId) {
    const { data: parent } = await adminClient
      .from("categories")
      .select("id")
      .eq("id", parsed.data.parentId)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json({ error: "Seçilen üst kategori bulunamadı." }, { status: 400 });
    }
  }
  const { data, error } = await adminClient
    .from("categories")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      parent_id: parsed.data.parentId || null,
      status: "active",
    })
    .select("id,name,slug")
    .single();
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "Bu kategori adı veya adresi zaten kayıtlı." : "Kategori oluşturulamadı." },
      { status: duplicate ? 409 : 500 },
    );
  }

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: `${data.name} kategorisi oluşturuldu`,
    module: "Kategori Yönetimi",
    entity_type: "category",
    entity_id: data.id,
    risk: "warning",
    details: { slug: data.slug, parent_id: parsed.data.parentId || null },
  });

  return NextResponse.json({ ok: true, category: data }, { status: 201 });
}
