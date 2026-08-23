import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

type StoreOrder={id:string;number:string;status:string;paymentStatus:string;recipient:string;city:string;createdAt:string;total:number;items:Array<Record<string,unknown>>};

export async function GET(){
 const auth=await createAuthServerClient(),{data:{user}}=await auth.auth.getUser();
 if(!user)return NextResponse.json({error:"Oturum gerekli."},{status:401});
 const admin=createSupabaseAdminClient();
 let{data:member}=await admin.from("store_members").select("store_id").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!member){const{data:seller}=await admin.from("sellers").select("id").eq("owner_user_id",user.id).eq("status","active").maybeSingle();if(seller){const{data:store}=await admin.from("stores").select("id").eq("seller_id",seller.id).in("status",["active","passive"]).maybeSingle();member=store?{store_id:store.id}:null}}
 if(!member)return NextResponse.json({error:"Mağaza erişimi bulunamadı."},{status:403});
 const{data,error}=await admin.from("order_items").select("id,order_id,product_title,variant_title,seller_sku,quantity,unit_price,line_total,fulfillment_status,created_at,orders!inner(order_number,status,payment_status,shipping_address,placed_at,created_at)").eq("store_id",member.store_id).order("created_at",{ascending:false});
 if(error)return NextResponse.json({error:"Siparişler alınamadı."},{status:500});
 const grouped=new Map<string,StoreOrder>();
 for(const row of data||[]){const order=Array.isArray(row.orders)?row.orders[0]:row.orders;if(!order)continue;const address=order.shipping_address as Record<string,unknown>;const current:StoreOrder=grouped.get(row.order_id)||{id:row.order_id,number:order.order_number,status:order.status,paymentStatus:order.payment_status,recipient:String(address?.recipient_name||"Müşteri"),city:String(address?.city||""),createdAt:order.placed_at||order.created_at,total:0,items:[]};current.total+=Number(row.line_total);current.items.push({id:row.id,productTitle:row.product_title,variantTitle:row.variant_title,sellerSku:row.seller_sku,quantity:row.quantity,unitPrice:Number(row.unit_price),lineTotal:Number(row.line_total),status:row.fulfillment_status});grouped.set(row.order_id,current)}
 return NextResponse.json({orders:Array.from(grouped.values())});
}
