import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
const schema=z.object({email:z.string().trim().toLowerCase().email()});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Geçerli bir e-posta adresi girin."},{status:400});const rate=await checkRateLimit(request,"seller_password_reset",parsed.data.email,3,3600);if(!rate.allowed)return NextResponse.json({error:rate.unavailable?"Güvenlik kontrolü geçici olarak kullanılamıyor.":"Çok fazla şifre bağlantısı istendi. Lütfen daha sonra tekrar deneyin."},{status:rate.unavailable?503:429,headers:{"Retry-After":String(rate.retryAfter)}});const auth=await createAuthServerClient();await auth.auth.resetPasswordForEmail(parsed.data.email,{redirectTo:`${new URL(request.url).origin}/set-password`});return NextResponse.json({ok:true,message:"Hesap mevcutsa şifre bağlantısı e-posta adresine gönderildi."})}
