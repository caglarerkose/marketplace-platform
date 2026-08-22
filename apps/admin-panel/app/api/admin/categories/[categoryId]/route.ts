import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "passive"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "Güncellenecek alan gerekli");

export async function PATCH(
  request: Request,
  context: { params: Promise<{ categoryId: string }> },
) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) {
    return NextResponse.json({ error: "Kategori düzenleme yetkiniz bulunmuyor." }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kategori güncelleme bilgileri geçersiz." }, { status: 400 });
  }

  const { categoryId } = await context.params;
  if (parsed.data.parentId === categoryId) {
    return NextResponse.json({ error: "Kategori kendisinin alt kategorisi olamaz." }, { status: 400 });
  }

  const updates = {
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.slug !== undefined && { slug: parsed.data.slug }),
    ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    ...(parsed.data.parentId !== undefined && { parent_id: parsed.data.parentId }),
    ...(parsed.data.status !== undefined && { status: parsed.data.status }),
  };
  const adminClient = createSupabaseAdminClient();
  if (parsed.data.parentId) {
    const { data: categoryTree, error: treeError } = await adminClient
      .from("categories")
      .select("id,parent_id");
    if (treeError) {
      return NextResponse.json({ error: "Kategori ilişkileri doğrulanamadı." }, { status: 500 });
    }
    const parents = new Map((categoryTree || []).map((category) => [category.id, category.parent_id]));
    if (!parents.has(parsed.data.parentId)) {
      return NextResponse.json({ error: "Seçilen üst kategori bulunamadı." }, { status: 400 });
    }
    let cursor: string | null = parsed.data.parentId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === categoryId) {
        return NextResponse.json({ error: "Bu seçim kategori ağacında döngü oluşturur." }, { status: 400 });
      }
      if (visited.has(cursor)) break;
      visited.add(cursor);
      cursor = parents.get(cursor) || null;
    }
  }
  const { data, error } = await adminClient
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .select("id,name,slug,status")
    .maybeSingle();
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "Bu kategori adı veya adresi zaten kayıtlı." : "Kategori güncellenemedi." },
      { status: duplicate ? 409 : 500 },
    );
  }
  if (!data) return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 });

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: `${data.name} kategorisi güncellendi`,
    module: "Kategori Yönetimi",
    entity_type: "category",
    entity_id: data.id,
    risk: parsed.data.status === "passive" ? "critical" : "warning",
    details: parsed.data,
  });

  return NextResponse.json({ ok: true, category: data });
}
