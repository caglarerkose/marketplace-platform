import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await auth.from("categories").select("id,name,parent_id").eq("status", "active").order("sort_order").order("name");
  if (error) return NextResponse.json({ error: "Kategoriler alınamadı." }, { status: 500 });
  return NextResponse.json({ categories: data || [] });
}
