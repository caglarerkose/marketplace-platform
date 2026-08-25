import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
const schema = z.object({
  mode: z.enum(["login", "register"]),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8),
  confirmPassword: z.string().default(""),
  displayName: z.string().trim().max(120).default(""),
}).refine(
  (value) => value.mode === "login" || value.password === value.confirmPassword,
  { message: "Şifreler eşleşmiyor.", path: ["confirmPassword"] },
);
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    (parsed.data.mode === "register" && parsed.data.displayName.length < 2)
  )
    return NextResponse.json(
      { error: "Bilgileri kontrol edin." },
      { status: 400 },
    );
  const v = parsed.data,
    rate = await checkRateLimit(
      request,
      v.mode === "login" ? "customer_login" : "customer_register",
      v.email,
      v.mode === "login" ? 8 : 4,
      v.mode === "login" ? 900 : 86400,
    );
  if (!rate.allowed)
    return NextResponse.json(
      {
        error: rate.unavailable
          ? "Güvenlik kontrolü geçici olarak kullanılamıyor."
          : "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
      },
      {
        status: rate.unavailable ? 503 : 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  const client = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (v.mode === "login") {
    const { data, error } = await admin.auth.signInWithPassword({
      email: v.email,
      password: v.password,
    });
    if (error || !data.session)
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 },
      );
    const { error: sessionError } = await client.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (sessionError)
      return NextResponse.json(
        { error: "Oturum başlatılamadı. Lütfen tekrar deneyin." },
        { status: 503 },
      );
    return NextResponse.json({ ok: true, destination: "/hesabim" });
  }
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: {
      account_type: "customer",
      display_name: v.displayName,
    },
  });
  if (createError || !created.user) {
    const duplicate =
      createError?.status === 422 ||
      createError?.message.toLocaleLowerCase("en-US").includes("already");
    return NextResponse.json(
      {
        error: duplicate
          ? "Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut."
          : "Hesap oluşturulamadı. Lütfen tekrar deneyin.",
      },
      { status: duplicate ? 409 : 400 },
    );
  }

  const { data: session, error: signInError } =
    await admin.auth.signInWithPassword({
      email: v.email,
      password: v.password,
    });
  if (signInError || !session.session) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Hesap oturumu başlatılamadı. Lütfen tekrar deneyin." },
      { status: 503 },
    );
  }
  const { error: sessionError } = await client.auth.setSession({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
  });
  if (sessionError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Hesap oturumu başlatılamadı. Lütfen tekrar deneyin." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { ok: true, destination: "/hesabim" },
    { status: 201 },
  );
}
