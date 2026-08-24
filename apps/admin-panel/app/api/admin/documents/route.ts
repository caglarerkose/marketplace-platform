import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const decision = z.object({ documentId: z.string().uuid(), status: z.enum(["under_review", "approved", "missing", "unreadable"]), note: z.string().trim().max(1000).default("") });

export async function GET(request: Request) {
  const actor = await requireAuthorizedAdmin("view");
  if (!actor) return NextResponse.json({ error: "Evrak görüntüleme yetkiniz bulunmuyor." }, { status: 403 });
  const admin = createSupabaseAdminClient();
  const id = new URL(request.url).searchParams.get("download");
  if (id) {
    const { data: document } = await admin.from("seller_application_documents").select("file_path").eq("id", id).maybeSingle();
    if (!document) return NextResponse.json({ error: "Evrak bulunamadı." }, { status: 404 });
    const { data, error } = await admin.storage.from("seller-documents").createSignedUrl(document.file_path, 300);
    return error ? NextResponse.json({ error: "Güvenli bağlantı oluşturulamadı." }, { status: 500 }) : NextResponse.json({ url: data.signedUrl });
  }
  const { data, error } = await admin.from("seller_application_documents")
    .select("id,document_type,original_file_name,mime_type,file_size,status,seller_note,admin_note,reviewed_at,created_at,seller_applications!inner(id,store_name,legal_name,business_type,contact_email)")
    .order("created_at", { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: "Evrak kuyruğu alınamadı." }, { status: 500 });
  return NextResponse.json({ documents: data || [] });
}

export async function PATCH(request: Request) {
  const actor = await requireAuthorizedAdmin("support");
  if (!actor) return NextResponse.json({ error: "Evrak değerlendirme yetkiniz bulunmuyor." }, { status: 403 });
  const parsed = decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Evrak kararını kontrol edin." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: document, error } = await admin.from("seller_application_documents").update({
    status: parsed.data.status, admin_note: parsed.data.note || null, reviewed_by: actor.userId, reviewed_at: new Date().toISOString(),
  }).eq("id", parsed.data.documentId).select("id,application_id,document_type").single();
  if (error) return NextResponse.json({ error: "Evrak kararı kaydedilemedi." }, { status: 409 });
  const { data: documents } = await admin.from("seller_application_documents").select("status").eq("application_id", document.application_id);
  const statuses = (documents || []).map(item => item.status);
  const documentStatus = statuses.length && statuses.every(status => status === "approved") ? "complete" : statuses.some(status => status === "missing" || status === "unreadable") ? "missing" : "under_review";
  await admin.from("seller_applications").update({ document_status: documentStatus, missing_field: documentStatus === "missing" ? document.document_type : null }).eq("id", document.application_id);
  await admin.from("admin_audit_logs").insert({ actor_user_id: actor.userId, actor_user_code: actor.userCode, action: "Satıcı evrakı değerlendirildi", module: "Evrak Yönetimi", entity_type: "seller_application_document", entity_id: document.id, risk: parsed.data.status === "approved" ? "info" : "warning", details: { status: parsed.data.status, note: parsed.data.note } });
  return NextResponse.json({ ok: true });
}
