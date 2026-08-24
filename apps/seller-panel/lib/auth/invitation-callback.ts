import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { databaseUrl, publishableKey } from "@/lib/supabase/config";

const allowedNextPaths = new Set(["/sifre-olustur", "/set-password", "/application-status", "/panel"]);
const allowedOtpTypes = new Set<EmailOtpType>(["invite", "recovery", "email", "email_change", "signup"]);

export async function handleInvitationCallback(request: NextRequest) {
  const url = request.nextUrl.clone();
  const requestedNext = url.searchParams.get("sonraki") || url.searchParams.get("next") || "/sifre-olustur";
  const nextPath = allowedNextPaths.has(requestedNext) ? requestedNext : "/sifre-olustur";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type") as EmailOtpType | null;
  const auth = createClient(databaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const result = code
    ? await auth.auth.exchangeCodeForSession(code)
    : tokenHash && requestedType && allowedOtpTypes.has(requestedType)
      ? await auth.auth.verifyOtp({ token_hash: tokenHash, type: requestedType })
      : null;

  if (!result) return NextResponse.redirect(new URL(nextPath, request.url));
  if (result.error || !result.data.session) {
    const failure = new URL("/sifre-olustur", request.url);
    failure.searchParams.set("hata", "gecersiz_davet");
    return NextResponse.redirect(failure);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("be_seller_access", result.data.session.access_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: result.data.session.expires_in,
  });
  response.cookies.set("be_seller_refresh", result.data.session.refresh_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
