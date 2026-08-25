import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { getCustomerEmailMap } from "@/lib/admin/customer-accounts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await requireAuthorizedAdmin("view"))) {
    return NextResponse.json(
      { error: "Genel bakış yetkiniz bulunmuyor." },
      { status: 403 },
    );
  }

  const db = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [
    metric,
    stores,
    customerProfiles,
    products,
    applications,
    tickets,
    logs,
    customerEmails,
  ] = await Promise.all([
    db
      .from("marketplace_daily_metrics")
      .select("*")
      .eq("metric_date", today)
      .maybeSingle(),
    db
      .from("stores")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    db.from("profiles").select("id").eq("account_status", "active"),
    db
      .from("catalog_products")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("seller_applications")
      .select("id,store_name,sales_category,status,created_at")
      .neq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("support_tickets")
      .select("id,ticket_number,subject,status,requester_type,last_message_at")
      .not("status", "in", "(resolved,closed)")
      .order("last_message_at", { ascending: false })
      .limit(5),
    db
      .from("admin_audit_logs")
      .select("id,action,module,risk_level,created_at,admin_users(user_code)")
      .order("created_at", { ascending: false })
      .limit(6),
    getCustomerEmailMap(db).catch(() => null),
  ]);

  if (
    [
      metric,
      stores,
      customerProfiles,
      products,
      applications,
      tickets,
      logs,
    ].some((result) => result.error) ||
    !customerEmails
  ) {
    return NextResponse.json(
      { error: "Genel bakış verileri alınamadı." },
      { status: 500 },
    );
  }

  const activeCustomerCount = (customerProfiles.data || []).filter((profile) =>
    customerEmails.has(profile.id),
  ).length;
  return NextResponse.json({
    summary: {
      revenue: Number(metric.data?.gross_merchandise_value || 0),
      orders: Number(metric.data?.order_count || 0),
      activeStores: stores.count || 0,
      activeCustomers: activeCustomerCount,
      pendingProducts: products.count || 0,
      openTickets: tickets.data?.length || 0,
    },
    applications: applications.data || [],
    tickets: tickets.data || [],
    logs: logs.data || [],
  });
}
