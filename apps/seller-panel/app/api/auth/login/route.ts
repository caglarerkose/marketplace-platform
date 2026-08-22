import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

const schema=z.object({email:z.string().trim().toLowerCase().email(),password:z.string().min(8).max(128)});
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"E-posta veya şifre hatalı."},{status:400});
 const auth=await createAuthServerClient();
 const {data,error}=await auth.auth.signInWithPassword(parsed.data);
 if(error||!data.user)return NextResponse.json({error:"E-posta veya şifre hatalı."},{status:401});
 const admin=createSupabaseAdminClient();
 const [{data:application},{data:seller}]=await Promise.all([
  admin.from("seller_applications").select("id,status").eq("applicant_user_id",data.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  admin.from("sellers").select("id,status").eq("owner_user_id",data.user.id).maybeSingle(),
 ]);
 if(!application&&!seller){await auth.auth.signOut();return NextResponse.json({error:"Bu hesap için satıcı başvurusu bulunamadı."},{status:403})}
 const destination=seller?.status==="active"?"/panel":"/application-status",response=NextResponse.json({ok:true,destination}),secure=process.env.NODE_ENV==="production";
 if(data.session){response.cookies.set("be_seller_access",data.session.access_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:data.session.expires_in});response.cookies.set("be_seller_refresh",data.session.refresh_token,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:60*60*24*30})}
 return response;
}
