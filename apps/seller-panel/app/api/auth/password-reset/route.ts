import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase/server";
const schema=z.object({email:z.string().trim().toLowerCase().email()});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Geçerli bir e-posta adresi girin."},{status:400});const auth=await createAuthServerClient();await auth.auth.resetPasswordForEmail(parsed.data.email,{redirectTo:`${new URL(request.url).origin}/set-password`});return NextResponse.json({ok:true,message:"Hesap mevcutsa şifre bağlantısı e-posta adresine gönderildi."})}
