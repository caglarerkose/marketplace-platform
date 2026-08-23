import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ruleSchema = z.object({ action: z.literal("rule"), categoryId: z.string().uuid().nullable().optional(), storeId: z.string().uuid().nullable().optional(), commissionRate: z.coerce.number().min(0).max(100), serviceFeeRate: z.coerce.number().min(0).max(100) }).refine(value => value.categoryId || value.storeId, "Kategori veya mağaza gereklidir.");
const settlementSchema = z.object({ action: z.literal("settlement"), storeId: z.string().uuid(), periodStart: z.string().date(), periodEnd: z.string().date() });

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor) return NextResponse.json({ error: "Finans görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const [rules, settlements, stores, categories, ledger] = await Promise.all([
    admin.from("commission_rules").select("id,commission_rate,service_fee_rate,status,starts_at,ends_at,categories(name),stores(name)").order("created_at", { ascending: false }),
    admin.from("seller_settlements").select("id,period_start,period_end,gross_amount,deduction_amount,net_amount,status,created_at,stores(name)").order("period_end", { ascending: false }),
    admin.from("stores").select("id,name").eq("status", "active").order("name"),
    admin.from("categories").select("id,name").eq("status", "active").order("name"),
    admin.from("seller_ledger_entries").select("amount,entry_type"),
  ]);
  if (rules.error || settlements.error || stores.error || categories.error || ledger.error) return NextResponse.json({ error: "Finans yönetimi verileri alınamadı." }, { status: 500 });
  return NextResponse.json({ rules: rules.data || [], settlements: settlements.data || [], stores: stores.data || [], categories: categories.data || [], ledger: ledger.data || [] });
}

export async function POST(request: Request) {
  const actor = await requireAuthorizedAdmin();
  if (!actor) return NextResponse.json({ error: "Finans yönetimi yetkiniz bulunmuyor." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (body.action === "rule") {
    const parsed = ruleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Kural bilgilerini kontrol edin." }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("commission_rules").insert({ category_id: parsed.data.categoryId || null, store_id: parsed.data.storeId || null, commission_rate: parsed.data.commissionRate, service_fee_rate: parsed.data.serviceFeeRate, created_by: actor.userId });
    if (error) return NextResponse.json({ error: "Komisyon kuralı oluşturulamadı." }, { status: 400 });
  } else {
    const parsed = settlementSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Hakediş dönemi bilgilerini kontrol edin." }, { status: 400 });
    const client = await createSupabaseServerClient();
    const { error } = await client.rpc("create_seller_settlement", { p_store_id: parsed.data.storeId, p_period_start: parsed.data.periodStart, p_period_end: parsed.data.periodEnd });
    if (error) return NextResponse.json({ error: error.message.includes("no_available") ? "Bu dönem için hakedişe uygun hareket bulunmuyor." : "Hakediş oluşturulamadı." }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
