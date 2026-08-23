import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

export async function GET() {
  const client = await createAuthServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data: memberships, error: memberError } = await client.from("store_members").select("store_id,stores(name)").eq("user_id", user.id).eq("status", "active");
  if (memberError) return NextResponse.json({ error: "Mağaza bilgisi alınamadı." }, { status: 500 });
  const storeIds = (memberships || []).map((item) => item.store_id);
  if (!storeIds.length) return NextResponse.json({ ledger: [], settlements: [], stores: [] });
  const [ledger, settlements] = await Promise.all([
    client.from("seller_ledger_entries").select("id,store_id,entry_type,amount,currency,description,available_at,created_at,orders(order_number),order_items(product_title)").in("store_id", storeIds).order("created_at", { ascending: false }).limit(200),
    client.from("seller_settlements").select("id,store_id,period_start,period_end,gross_amount,deduction_amount,net_amount,currency,status,approved_at,paid_at,created_at").in("store_id", storeIds).order("period_end", { ascending: false }).limit(100),
  ]);
  if (ledger.error || settlements.error) return NextResponse.json({ error: "Finans kayıtları alınamadı." }, { status: 500 });
  return NextResponse.json({ stores: memberships || [], ledger: ledger.data || [], settlements: settlements.data || [] });
}
