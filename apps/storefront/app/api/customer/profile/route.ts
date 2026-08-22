import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const schema=z.object({displayName:z.string().trim().min(2).max(120),phone:z.string().trim().max(30)});
export async function PATCH(request:Request){const client=await createSupabaseServerClient(),{data:{user}}=await client.auth.getUser();if(!user)return NextResponse.json({error:"Oturum gerekli."},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Profil bilgilerini kontrol edin."},{status:400});const{data,error}=await client.from("profiles").update({display_name:parsed.data.displayName,phone:parsed.data.phone||null}).eq("id",user.id).select("display_name,phone").single();if(error)return NextResponse.json({error:"Profil güncellenemedi."},{status:500});return NextResponse.json({ok:true,profile:data})}
