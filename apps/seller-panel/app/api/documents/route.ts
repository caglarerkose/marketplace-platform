import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const types = new Set(["tax_certificate", "signature_circular", "iban_document", "authorized_identity", "activity_certificate", "other"]);
const mimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

async function context() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: application } = await admin.from("seller_applications")
    .select("id,status,document_status,admin_note,missing_field")
    .eq("applicant_user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return application ? { admin, userId: user.id, application } : null;
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "Satıcı başvurusu oturumu bulunamadı." }, { status: 403 });
  const { data, error } = await ctx.admin.from("seller_application_documents")
    .select("id,document_type,original_file_name,mime_type,file_size,status,seller_note,admin_note,reviewed_at,created_at,updated_at")
    .eq("application_id", ctx.application.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Evraklar alınamadı." }, { status: 500 });
  return NextResponse.json({ documents: data || [], application: ctx.application });
}

export async function POST(request: Request) {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "Satıcı başvurusu oturumu bulunamadı." }, { status: 403 });
  if (ctx.application.status === "rejected") return NextResponse.json({ error: "Reddedilmiş başvuruya evrak eklenemez." }, { status: 409 });
  const form = await request.formData();
  const file = form.get("file");
  const documentType = String(form.get("documentType") || "");
  const note = String(form.get("note") || "").trim().slice(0, 1000);
  if (!(file instanceof File) || !types.has(documentType) || !mimeTypes.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF, JPG veya PNG biçiminde en fazla 10 MB evrak yükleyin." }, { status: 400 });
  }
  const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${ctx.application.id}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await ctx.admin.storage.from("seller-documents").upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Evrak güvenli depoya yüklenemedi." }, { status: 500 });
  const { data, error } = await ctx.admin.from("seller_application_documents").insert({
    application_id: ctx.application.id, document_type: documentType, file_path: path,
    original_file_name: file.name.slice(0, 240), mime_type: file.type, file_size: file.size, seller_note: note || null,
  }).select("id").single();
  if (error) {
    await ctx.admin.storage.from("seller-documents").remove([path]);
    return NextResponse.json({ error: "Evrak kaydı oluşturulamadı." }, { status: 500 });
  }
  await ctx.admin.from("seller_applications").update({ document_status: "under_review", missing_field: null }).eq("id", ctx.application.id);
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
