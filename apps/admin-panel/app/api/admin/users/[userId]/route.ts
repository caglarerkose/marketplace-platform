import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  permissions: z.array(z.enum(["view", "support", "product_approval"])).optional(),
  status: z.enum(["active", "passive"]).optional(),
}).refine((value) => value.permissions || value.status, "Güncelleme alanı gerekli");

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const actor = await requireAuthorizedAdmin();
  if (!actor?.isSuperAdmin) {
    return NextResponse.json({ error: "Bu işlem için Super Admin yetkisi gerekir." }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Güncelleme bilgileri geçersiz." }, { status: 400 });
  }
  const { userId } = await context.params;
  const adminClient = createSupabaseAdminClient();
  const { data: target } = await adminClient
    .from("admin_users")
    .select("user_code,is_super_admin,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  if (target.is_super_admin) {
    return NextResponse.json({ error: "Super Admin hesabı değiştirilemez." }, { status: 409 });
  }

  if (parsed.data.permissions !== undefined) {
    const { error: deleteError } = await adminClient
      .from("admin_user_permissions")
      .delete()
      .eq("user_id", userId);
    if (deleteError) {
      return NextResponse.json({ error: "Mevcut yetkiler kaldırılamadı." }, { status: 500 });
    }
    if (parsed.data.permissions.length) {
      const { error: insertError } = await adminClient.from("admin_user_permissions").insert(
        parsed.data.permissions.map((permission) => ({
          user_id: userId,
          permission_code: permission,
          granted_by: actor.userId,
        })),
      );
      if (insertError) {
        return NextResponse.json({ error: "Yetkiler kaydedilemedi." }, { status: 500 });
      }
    }
  }
  if (parsed.data.status) {
    const { error } = await adminClient
      .from("admin_users")
      .update({ status: parsed.data.status })
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: "Kullanıcı durumu güncellenemedi." }, { status: 500 });
  }

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: `${target.user_code} kullanıcısının erişimi güncellendi`,
    module: "Kullanıcı Yönetimi",
    entity_type: "admin_user",
    entity_id: userId,
    risk: parsed.data.status === "passive" ? "critical" : "warning",
    details: parsed.data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const actor = await requireAuthorizedAdmin();
  if (!actor?.isSuperAdmin) {
    return NextResponse.json({ error: "Bu işlem için Super Admin yetkisi gerekir." }, { status: 403 });
  }

  const { userId } = await context.params;
  const adminClient = createSupabaseAdminClient();
  const { data: target } = await adminClient
    .from("admin_users")
    .select("user_code,is_super_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  if (target.is_super_admin) {
    return NextResponse.json({ error: "Super Admin hesabı silinemez." }, { status: 409 });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: "Kullanıcı silinemedi." }, { status: 500 });
  }

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: `${target.user_code} kodlu panel kullanıcısı silindi`,
    module: "Kullanıcı Yönetimi",
    entity_type: "admin_user",
    entity_id: userId,
    risk: "critical",
    details: { deleted_user_code: target.user_code },
  });

  return NextResponse.json({ ok: true });
}
