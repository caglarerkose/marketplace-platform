import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const applicationSchema = z.object({
  legalName: z.string().trim().min(2).max(180), storeName: z.string().trim().min(2).max(120),
  authorizedName: z.string().trim().min(2).max(120), phone: z.string().trim().min(10).max(20),
  email: z.string().trim().toLowerCase().email().max(254),
  businessType: z.enum(["sole_proprietorship", "limited", "corporation"]),
  taxNumber: z.string().trim().regex(/^\d{10,11}$/), salesCategory: z.string().trim().min(2).max(120),
  iban: z.string().trim().transform((value) => value.toUpperCase().replace(/\s/g, "")).pipe(z.string().regex(/^TR\d{24}$/)),
  preferredShippingCompany: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80), referralCode: z.string().trim().max(50).optional(),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) return NextResponse.json({ error: "Başvuru verisi çok büyük." }, { status: 413 });
  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.website) return NextResponse.json({ error: "Başvuru bilgilerini kontrol edin." }, { status: 400 });

  const adminClient = createSupabaseAdminClient();
  const { data: registeredSeller, error: sellerLookupError } = await adminClient
    .from("sellers")
    .select("id")
    .eq("tax_number", parsed.data.taxNumber)
    .maybeSingle();
  if (sellerLookupError) {
    return NextResponse.json({ error: "Başvuru bilgileri kontrol edilemedi. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
  }
  if (registeredSeller) {
    return NextResponse.json({ error: "Bu vergi numarasıyla kayıtlı satıcı zaten mevcut." }, { status: 409 });
  }

  const { error } = await adminClient.from("seller_applications").insert({
    business_type: parsed.data.businessType, legal_name: parsed.data.legalName,
    tax_number: parsed.data.taxNumber, store_name: parsed.data.storeName, contact_email: parsed.data.email,
    contact_phone: parsed.data.phone, authorized_name: parsed.data.authorizedName, sales_category: parsed.data.salesCategory,
    iban: parsed.data.iban, preferred_shipping_company: parsed.data.preferredShippingCompany,
    city: parsed.data.city, district: parsed.data.district, referral_code: parsed.data.referralCode || null,
    status: "submitted", submitted_at: new Date().toISOString(),
  });
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "Bu bilgilerle açık bir satıcı başvurusu zaten mevcut." : "Başvuru kaydedilemedi." },
      { status: duplicate ? 409 : 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
