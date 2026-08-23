import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor) return NextResponse.json({ error: "Müşteri görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const [{ data: profiles, error }, { data: orders }] = await Promise.all([
    admin.from("profiles").select("id,display_name,phone,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
    admin.from("orders").select("customer_user_id,grand_total,status,created_at").order("created_at", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: "Müşteri listesi alınamadı." }, { status: 500 });
  const authResult = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emails = new Map((authResult.data?.users || []).map(user => [user.id, user.email || ""]));
  const totals = new Map<string, { count: number; total: number; last: string | null }>();
  for (const order of orders || []) {
    const current = totals.get(order.customer_user_id) || { count: 0, total: 0, last: null };
    current.count += 1; current.total += Number(order.grand_total); current.last ||= order.created_at;
    totals.set(order.customer_user_id, current);
  }
  return NextResponse.json({ customers: (profiles || []).map(profile => ({ ...profile, email: emails.get(profile.id) || "", orders: totals.get(profile.id)?.count || 0, spending: totals.get(profile.id)?.total || 0, last_order_at: totals.get(profile.id)?.last || null })) });
}
