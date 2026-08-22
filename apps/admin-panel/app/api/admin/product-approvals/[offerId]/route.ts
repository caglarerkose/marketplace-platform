import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), productId: z.string().uuid() }),
  z.object({ decision: z.literal("reject"), productId: z.string().uuid(), reason: z.string().trim().min(3).max(1000) }),
]);

export async function PATCH(request: Request, context: { params: Promise<{ offerId: string }> }) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) return NextResponse.json({ error: "Ürün onaylama yetkiniz bulunmuyor." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Onay bilgilerini kontrol edin." }, { status: 400 });
  const { offerId } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data: offer } = await admin.from("seller_offers").select("id,seller_sku,stores(name)").eq("id", offerId).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Ürün teklifi bulunamadı." }, { status: 404 });
  const { error } = await admin.rpc("review_seller_product_submission", {
    p_product_id: parsed.data.productId, p_offer_id: offerId, p_reviewer_id: actor.userId,
    p_decision: parsed.data.decision, p_reason: parsed.data.decision === "reject" ? parsed.data.reason : null,
  });
  if (error) {
    const reviewed = error.message.includes("submission_already_reviewed");
    return NextResponse.json({ error: reviewed ? "Bu ürün başka bir işlemle değerlendirilmiş." : "Ürün değerlendirmesi kaydedilemedi." }, { status: reviewed ? 409 : 500 });
  }
  const store = Array.isArray(offer.stores) ? offer.stores[0] : offer.stores;
  await admin.from("admin_audit_logs").insert({
    actor_user_id: actor.userId, actor_user_code: actor.userCode,
    action: `${store?.name || "Mağaza"} ${offer.seller_sku} ürünü ${parsed.data.decision === "approve" ? "onaylandı" : "reddedildi"}`,
    module: "Ürün Onayları", entity_type: "seller_offer", entity_id: offerId,
    risk: parsed.data.decision === "approve" ? "warning" : "critical",
    details: { decision: parsed.data.decision, product_id: parsed.data.productId, reason: parsed.data.decision === "reject" ? parsed.data.reason : null },
  });
  return NextResponse.json({ ok: true });
}
