import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const safeNext = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/hesabim";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const client = await createSupabaseServerClient();
  let failed = false;
  if (code) failed = Boolean((await client.auth.exchangeCodeForSession(code)).error);
  else if (tokenHash && type) failed = Boolean((await client.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "email" | "recovery" })).error);
  else failed = true;
  return NextResponse.redirect(new URL(failed ? "/giris?error=confirmation" : safeNext(url.searchParams.get("next")), url.origin), 303);
}
