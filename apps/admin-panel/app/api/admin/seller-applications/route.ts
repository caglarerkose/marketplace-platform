import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor) {
    return NextResponse.json({ error: "Satıcı başvurularını görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const [{ data: applications, error: applicationError }, { data: stores, error: storeError }] = await Promise.all([
    adminClient.from("seller_applications")
      .select("id,applicant_user_id,business_type,legal_name,tax_number,store_name,contact_email,contact_phone,authorized_name,sales_category,iban,preferred_shipping_company,document_status,missing_field,review_checklist,status,admin_note,submitted_at,reviewed_at,created_at,updated_at")
      .order("created_at", { ascending: false }),
    adminClient.from("stores")
      .select("id,name,slug,status,created_at,sellers!inner(id,legal_name,status,approved_application_id)")
      .neq("sellers.status", "closed")
      .order("created_at", { ascending: false }),
  ]);

  if (applicationError || storeError) {
    return NextResponse.json({ error: "Satıcı yönetimi verileri alınamadı." }, { status: 500 });
  }

  return NextResponse.json({ applications: applications || [], stores: stores || [] });
}
