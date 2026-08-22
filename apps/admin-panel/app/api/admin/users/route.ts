import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(1),
  permissions: z.array(z.enum(["view", "support", "product_approval"])).min(1),
});

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor?.isSuperAdmin) {
    return NextResponse.json({ error: "Bu işlem için Super Admin yetkisi gerekir." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: rows, error } = await adminClient
    .from("admin_users")
    .select("user_id,user_code,is_super_admin,status,created_at,admin_user_permissions(permission_code)")
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "Kullanıcılar alınamadı." }, { status: 500 });
  }

  const users = await Promise.all((rows || []).map(async (row) => {
    const [{ data: authData }, { data: profile }] = await Promise.all([
      adminClient.auth.admin.getUserById(row.user_id),
      adminClient.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle(),
    ]);
    return {
      id: row.user_id,
      code: row.user_code,
      name: row.is_super_admin
        ? "SUPERADMIN"
        : profile?.display_name || authData.user?.user_metadata?.display_name || "Panel Kullanıcısı",
      email: authData.user?.email || "",
      permissions: row.is_super_admin
        ? ["view", "support", "product_approval"]
        : row.admin_user_permissions.map((item) => item.permission_code),
      status: row.status,
      lastSeen: authData.user?.last_sign_in_at || null,
      isSuperAdmin: row.is_super_admin,
    };
  }));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor?.isSuperAdmin) {
    return NextResponse.json({ error: "Bu işlem için Super Admin yetkisi gerekir." }, { status: 403 });
  }
  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kullanıcı bilgileri geçersiz." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: existingAdmins, error: existingAdminsError } = await adminClient
    .from("admin_users")
    .select("user_id");
  if (existingAdminsError) {
    return NextResponse.json({ error: "Mevcut kullanıcılar kontrol edilemedi." }, { status: 500 });
  }
  const adminIds = (existingAdmins || []).map((user) => user.user_id);
  if (adminIds.length) {
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("display_name")
      .in("id", adminIds);
    if (profilesError) {
      return NextResponse.json({ error: "Mevcut kullanıcılar kontrol edilemedi." }, { status: 500 });
    }
    const requestedName = parsed.data.name.trim().toLocaleLowerCase("tr-TR");
    const duplicateName = (profiles || []).some(
      (profile) => profile.display_name?.trim().toLocaleLowerCase("tr-TR") === requestedName,
    );
    if (duplicateName) {
      return NextResponse.json(
        { error: "Bu ad soyad ile kayıtlı bir panel kullanıcısı zaten mevcut." },
        { status: 409 },
      );
    }
  }
  const { data: codeData, error: codeError } = await adminClient.rpc("next_admin_user_code");
  if (codeError || !codeData) {
    return NextResponse.json({ error: "Kullanıcı kodu üretilemedi." }, { status: 500 });
  }

  const { data: created, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.name },
  });
  if (authError || !created.user) {
    return NextResponse.json({ error: authError?.message || "Auth kullanıcısı oluşturulamadı." }, { status: 400 });
  }

  const { error: adminError } = await adminClient.from("admin_users").insert({
    user_id: created.user.id,
    user_code: codeData,
    is_super_admin: false,
    status: "active",
    created_by: actor.userId,
  });
  if (adminError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Panel kullanıcısı oluşturulamadı." }, { status: 500 });
  }

  await adminClient.from("admin_user_permissions").insert(
    parsed.data.permissions.map((permission) => ({
      user_id: created.user.id,
      permission_code: permission,
      granted_by: actor.userId,
    })),
  );
  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: `${codeData} koduyla panel kullanıcısı oluşturuldu`,
    module: "Kullanıcı Yönetimi",
    entity_type: "admin_user",
    entity_id: created.user.id,
    risk: "warning",
    details: { permissions: parsed.data.permissions },
  });

  return NextResponse.json({ ok: true, userCode: codeData }, { status: 201 });
}
