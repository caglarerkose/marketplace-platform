import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor?.isSuperAdmin) {
    return NextResponse.json({ error: "Bu işlem için Super Admin yetkisi gerekir." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("admin_audit_logs")
    .select("id,actor_user_code,action,module,entity_type,entity_id,risk,details,user_agent,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: "İşlem logları alınamadı." }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
