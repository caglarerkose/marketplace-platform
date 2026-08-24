import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sellerId: string }> },
) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) {
    return NextResponse.json({ error: "Satıcı silme yetkiniz bulunmuyor." }, { status: 403 });
  }

  const { sellerId } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data: seller } = await admin
    .from("sellers")
    .select("id,legal_name,status,stores(id,name)")
    .eq("id", sellerId)
    .maybeSingle();

  if (!seller || seller.status === "closed") {
    return NextResponse.json({ error: "Satıcı bulunamadı veya daha önce silinmiş." }, { status: 404 });
  }

  const { data, error } = await admin.rpc("close_seller_account", {
    p_seller_id: sellerId,
    p_actor_id: actor.userId,
  });
  if (error) {
    return NextResponse.json({ error: "Satıcı hesabı silinemedi." }, { status: 409 });
  }

  await admin.from("admin_audit_logs").insert({
    actor_user_id: actor.userId,
    actor_user_code: actor.userCode,
    action: seller.legal_name + " satıcı hesabı silindi",
    module: "Satıcı Yönetimi",
    entity_type: "seller",
    entity_id: sellerId,
    risk: "critical",
    details: {
      seller_status: "closed",
      stores: seller.stores,
      result: data,
      retained_records: ["orders", "payments", "settlements", "audit_logs"],
    },
  });

  return NextResponse.json({ ok: true });
}
