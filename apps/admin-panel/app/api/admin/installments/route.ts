import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ruleSchema = z.object({
  id: z.string().uuid().optional(), categoryName: z.string().trim().min(2).max(120),
  maxInstallments: z.number().int().refine(v => [1,3,6,9,12].includes(v)),
  feeMode: z.enum(["none","rate"]), feeRate: z.number().min(0).max(100),
  minimumCartTotal: z.number().min(0), status: z.enum(["active","passive","limited"]),
  sellerNote: z.string().trim().max(1000),
});
const requestSchema = z.object({ requestId:z.string().uuid(), status:z.enum(["reviewing","resolved","rejected"]), adminNote:z.string().trim().max(1000).optional() });

export async function GET(){
  if(!await requireAuthorizedAdmin("view")) return NextResponse.json({error:"Taksit bilgilerini görüntüleme yetkiniz bulunmuyor."},{status:403});
  const db=createSupabaseAdminClient();
  const [rules,requests]=await Promise.all([
    db.from("installment_rules").select("*").order("category_name"),
    db.from("installment_information_requests").select("*,stores(name)").order("created_at",{ascending:false})
  ]);
  if(rules.error||requests.error) return NextResponse.json({error:"Taksit bilgileri alınamadı."},{status:500});
  return NextResponse.json({rules:rules.data||[],requests:requests.data||[]});
}
export async function PUT(request:Request){
  const actor=await requireAuthorizedAdmin(); if(!actor) return NextResponse.json({error:"Taksit kuralı düzenleme yetkiniz bulunmuyor."},{status:403});
  const parsed=ruleSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({error:"Taksit kuralı alanlarını kontrol edin."},{status:400});
  const v=parsed.data, payload={category_name:v.categoryName,max_installments:v.maxInstallments,fee_mode:v.feeMode,fee_rate:v.feeMode==="none"?0:v.feeRate,minimum_cart_total:v.minimumCartTotal,status:v.status,seller_note:v.sellerNote||null,published_at:new Date().toISOString(),updated_by:actor.userId};
  const db=createSupabaseAdminClient();
  const query=v.id?db.from("installment_rules").update(payload).eq("id",v.id):db.from("installment_rules").insert({...payload,created_by:actor.userId});
  const {error}=await query; return error?NextResponse.json({error:"Bu kategori için kayıtlı bir taksit kuralı zaten mevcut."},{status:409}):NextResponse.json({ok:true});
}
export async function PATCH(request:Request){
  const actor=await requireAuthorizedAdmin(); if(!actor) return NextResponse.json({error:"Talebi sonuçlandırma yetkiniz bulunmuyor."},{status:403});
  const parsed=requestSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({error:"Talep işlemi geçersiz."},{status:400});
  const v=parsed.data,{error}=await createSupabaseAdminClient().from("installment_information_requests").update({status:v.status,admin_note:v.adminNote||null,resolved_by:actor.userId,resolved_at:["resolved","rejected"].includes(v.status)?new Date().toISOString():null}).eq("id",v.requestId);
  return error?NextResponse.json({error:"Talep güncellenemedi."},{status:409}):NextResponse.json({ok:true});
}
