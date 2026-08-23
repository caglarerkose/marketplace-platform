import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(){
 const actor=await requireAuthorizedAdmin("view");
 if(!actor)return NextResponse.json({error:"Siparişleri görüntüleme yetkiniz bulunmuyor."},{status:403});
 const admin=createSupabaseAdminClient();
 const{data,error}=await admin.from("orders").select("id,order_number,status,payment_status,currency,subtotal,discount_total,shipping_total,grand_total,shipping_address,placed_at,created_at,order_items(id,store_id,product_title,variant_title,seller_name,quantity,line_total,fulfillment_status)").order("created_at",{ascending:false}).limit(250);
 if(error)return NextResponse.json({error:"Siparişler alınamadı."},{status:500});
 return NextResponse.json({orders:data||[]});
}
