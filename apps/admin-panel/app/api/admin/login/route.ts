import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  userCode: z.string().trim().toUpperCase().regex(/^(SUPER|ADM)-[0-9]{3,}$/),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kullanıcı kodu veya şifre hatalı." }, { status: 400 });
  }
  const rate = await checkRateLimit(request, "admin_login", parsed.data.userCode, 6, 900);
  if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Güvenlik kontrolü geçici olarak kullanılamıyor." : "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin." }, { status: rate.unavailable ? 503 : 429, headers: { "Retry-After": String(rate.retryAfter) } });

  const adminClient = createSupabaseAdminClient();
  const { data: adminUser, error: adminLookupError } = await adminClient
    .from("admin_users")
    .select("user_id,user_code,status")
    .eq("user_code", parsed.data.userCode)
    .eq("status", "active")
    .maybeSingle();

  if (!adminUser) {
    console.error("ADMIN_LOGIN_LOOKUP_FAILED", {
      code: adminLookupError?.code,
      message: adminLookupError?.message,
    });
    return NextResponse.json({ error: "Kullanıcı kodu veya şifre hatalı." }, { status: 401 });
  }

  const { data: authUser, error: authLookupError } =
    await adminClient.auth.admin.getUserById(adminUser.user_id);
  const email = authUser.user?.email;
  if (authLookupError || !email) {
    console.error("ADMIN_LOGIN_AUTH_USER_FAILED", {
      message: authLookupError?.message,
      hasEmail: Boolean(email),
    });
    return NextResponse.json({ error: "Kullanıcı kodu veya şifre hatalı." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (signInError) {
    console.error("ADMIN_LOGIN_PASSWORD_FAILED", {
      code: signInError.code,
      status: signInError.status,
      message: signInError.message,
    });
    return NextResponse.json({ error: "Kullanıcı kodu veya şifre hatalı." }, { status: 401 });
  }

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: adminUser.user_id,
    actor_user_code: adminUser.user_code,
    action: "Admin paneline giriş yapıldı",
    module: "Kimlik Doğrulama",
    entity_type: "session",
    risk: "info",
    details: { method: "user_code_password" },
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
