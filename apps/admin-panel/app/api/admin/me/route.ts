import { NextResponse } from "next/server";
import { requireAuthorizedAdmin } from "@/lib/admin/authorization";

export async function GET() {
  const actor = await requireAuthorizedAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  return NextResponse.json({
    userCode: actor.userCode,
    isSuperAdmin: actor.isSuperAdmin,
  });
}
