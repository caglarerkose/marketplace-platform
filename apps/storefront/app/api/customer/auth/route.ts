import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
const schema = z.object({
  mode: z.enum(["login", "register"]),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8),
  displayName: z.string().trim().max(120).default(""),
});
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
  if (v.mode === "login") {
    const { data, error } = await client.auth.signInWithPassword({
      email: v.email,
      password: v.password,
    });
    if (error || !data.session)
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 },
      );
    return NextResponse.json({ ok: true, destination: "/hesabim" });
  }
  const { data, error } = await client.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: { display_name: v.displayName },
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=/hesabim`,
    },
  });
  if (error)
    return NextResponse.json(
      { error: "Hesap oluşturulamadı. Bilgileri kontrol edin." },
      { status: 400 },
    );
  return NextResponse.json(
    {
      ok: true,
      destination: data.session ? "/hesabim" : null,
      message: data.session
        ? null
        : "E-posta adresinize gönderilen doğrulama bağlantısını açın.",
    },
    { status: 201 },
  );
}
