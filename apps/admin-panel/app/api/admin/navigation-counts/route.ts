import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor) return NextResponse.json({ error: "Yönetim paneli erişimi gerekli." }, { status: 403 });
  const adminClient = createSupabaseAdminClient();
  const { count, error } = await adminClient.from("seller_applications")
    .select("id", { count: "exact", head: true })
    .in("status", ["submitted", "under_review", "revision_requested"]);
  if (error) return NextResponse.json({ error: "Menü sayaçları alınamadı." }, { status: 500 });
  return NextResponse.json({ counts: { sellers: count || 0 } });
}
