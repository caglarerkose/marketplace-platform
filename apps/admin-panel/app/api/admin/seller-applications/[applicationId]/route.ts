import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review"), note: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal("request_revision"), note: z.string().trim().min(3).max(1000), missingField: z.string().trim().min(2).max(120) }),
  z.object({ action: z.literal("reject"), note: z.string().trim().min(3).max(1000) }),
  z.object({ action: z.literal("approve"), note: z.string().trim().max(1000).optional() }),
  z.object({
    action: z.literal("update_review"),
    note: z.string().trim().max(1000).optional(),
    documentStatus: z.enum(["pending", "under_review", "complete", "missing"]),
    checklist: z.object({
      store_name_valid: z.boolean(), authorized_person_verified: z.boolean(), contact_verified: z.boolean(),
      company_verified: z.boolean(), documents_complete: z.boolean(), iban_verified: z.boolean(),
    }),
  }),
]);

const sellerPanelUrl = (process.env.SELLER_PANEL_URL || "https://marketplace-platform-seller-panel.vercel.app")
  .replace(/\/$/, "");

function slugify(value: string) {
  return value.toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i").replaceAll("ğ", "g").replaceAll("ü", "u")
    .replaceAll("ş", "s").replaceAll("ö", "o").replaceAll("ç", "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "magaza";
}

async function availableStoreSlug(adminClient: ReturnType<typeof createSupabaseAdminClient>, name: string) {
  const base = slugify(name);
  const { data } = await adminClient.from("stores").select("slug").like("slug", `${base}%`);
  const used = new Set((data || []).map((store) => store.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function PATCH(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  const actor = await requireAuthorizedAdmin("product_approval");
  if (!actor) {
    return NextResponse.json({ error: "Satıcı başvurusu değerlendirme yetkiniz bulunmuyor." }, { status: 403 });
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Değerlendirme bilgileri geçersiz." }, { status: 400 });
  const { applicationId } = await context.params;
  const adminClient = createSupabaseAdminClient();
  const { data: application } = await adminClient.from("seller_applications")
    .select("id,applicant_user_id,store_name,status,contact_email,authorized_name,iban,document_status,review_checklist").eq("id", applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: "Satıcı başvurusu bulunamadı." }, { status: 404 });

  if (parsed.data.action === "update_review") {
    if (application.status !== "under_review") {
      return NextResponse.json({ error: "Kontrol listesi yalnızca incelemedeki başvuruda güncellenebilir." }, { status: 409 });
    }
    const { error } = await adminClient.from("seller_applications").update({
      admin_note: parsed.data.note || null,
      document_status: parsed.data.documentStatus,
      review_checklist: parsed.data.checklist,
      reviewed_by: actor.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", applicationId).eq("status", "under_review");
    if (error) return NextResponse.json({ error: "Başvuru kontrol listesi kaydedilemedi." }, { status: 500 });
    await adminClient.from("admin_audit_logs").insert({
      actor_user_id: actor.userId, actor_user_code: actor.userCode,
      action: `${application.store_name} başvuru kontrolleri güncellendi`, module: "Satıcı Yönetimi",
      entity_type: "seller_application", entity_id: applicationId, risk: "warning",
      details: { document_status: parsed.data.documentStatus, checklist: parsed.data.checklist },
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "approve") {
    if (application.status !== "under_review") {
      return NextResponse.json({ error: "Başvuru onaylanmadan önce incelemeye alınmalıdır." }, { status: 409 });
    }
    const checks = application.review_checklist as Record<string, boolean> | null;
    const requiredChecks = ["store_name_valid", "authorized_person_verified", "contact_verified", "company_verified", "documents_complete", "iban_verified"];
    if (!application.authorized_name || !application.iban || application.document_status !== "complete" || !checks || requiredChecks.some((key) => checks[key] !== true)) {
      return NextResponse.json({ error: "Yetkili, IBAN, evrak durumu ve tüm kontrol maddeleri tamamlanmadan başvuru onaylanamaz." }, { status: 409 });
    }
    let applicantUserId = application.applicant_user_id;
    let invitedNow = false;
    if (!applicantUserId) {
      const { data: invitation, error: invitationError } = await adminClient.auth.admin.inviteUserByEmail(
        application.contact_email,
        {
          redirectTo: `${sellerPanelUrl}/davet/onay?sonraki=/sifre-olustur`,
          data: {
            account_type: "seller",
            display_name: application.authorized_name,
          },
        },
      );
      if (invitationError || !invitation.user) {
        const registered = invitationError?.message.toLocaleLowerCase("en-US").includes("already") || invitationError?.status === 422;
        return NextResponse.json(
          { error: registered ? "Bu e-posta adresiyle bir hesap zaten mevcut." : "Satıcı daveti gönderilemedi." },
          { status: registered ? 409 : 503 },
        );
      }
      applicantUserId = invitation.user.id;
      invitedNow = true;
      const { error: linkError } = await adminClient.from("seller_applications")
        .update({ applicant_user_id: applicantUserId })
        .eq("id", applicationId)
        .is("applicant_user_id", null);
      if (linkError) {
        await adminClient.auth.admin.deleteUser(applicantUserId);
        return NextResponse.json({ error: "Davet kullanıcısı başvuruya bağlanamadı." }, { status: 500 });
      }
    }
    const storeSlug = await availableStoreSlug(adminClient, application.store_name);
    const { data, error } = await adminClient.rpc("approve_seller_application", {
      p_application_id: applicationId,
      p_reviewer_id: actor.userId,
      p_store_slug: storeSlug,
      p_admin_note: parsed.data.note || null,
    });
    if (error) {
      if (invitedNow && applicantUserId) {
        await adminClient.from("seller_applications").update({ applicant_user_id: null }).eq("id", applicationId);
        await adminClient.auth.admin.deleteUser(applicantUserId);
      }
      const message = error.message.includes("seller_already_exists")
        ? "Bu başvuru sahibine ait satıcı hesabı zaten mevcut."
        : error.code === "23505" && error.message.includes("tax_number")
          ? "Bu vergi numarasıyla kayıtlı satıcı zaten mevcut."
        : error.message.includes("application_not_reviewable")
          ? "Bu başvuru mevcut durumunda onaylanamaz."
          : "Satıcı başvurusu onaylanamadı.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    await adminClient.from("admin_audit_logs").insert({
      actor_user_id: actor.userId, actor_user_code: actor.userCode,
      action: `${application.store_name} satıcı başvurusu onaylandı`, module: "Satıcı Yönetimi",
      entity_type: "seller_application", entity_id: applicationId, risk: "warning",
      details: { action: parsed.data.action, store_slug: storeSlug, result: data, invitation_sent: invitedNow },
    });
    return NextResponse.json({ ok: true });
  }

  const status = parsed.data.action === "review" ? "under_review"
    : parsed.data.action === "request_revision" ? "revision_requested" : "rejected";
  const allowedStatuses = parsed.data.action === "review" ? ["submitted"] : ["under_review"];
  const { data, error } = await adminClient.from("seller_applications").update({
    status,
    admin_note: parsed.data.note || null,
    ...(parsed.data.action === "request_revision" && { missing_field: parsed.data.missingField, document_status: "missing" }),
    reviewed_by: actor.userId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", applicationId).in("status", allowedStatuses).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Başvuru durumu güncellenemedi." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Başvurunun durumu başka bir işlem tarafından değiştirilmiş." }, { status: 409 });

  const labels = { review: "incelemeye alındı", request_revision: "revizyona gönderildi", reject: "reddedildi" } as const;
  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.userId, actor_user_code: actor.userCode,
    action: `${application.store_name} başvurusu ${labels[parsed.data.action]}`, module: "Satıcı Yönetimi",
    entity_type: "seller_application", entity_id: applicationId,
    risk: parsed.data.action === "reject" ? "critical" : "warning",
    details: { action: parsed.data.action, note: parsed.data.note || null },
  });
  return NextResponse.json({ ok: true });
}
