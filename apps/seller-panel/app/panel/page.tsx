import { redirect } from "next/navigation";
import { SellerShell } from "@/components/seller-shell";
import { SellerContent } from "@/components/seller-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAuthServerClient } from "@/lib/supabase/server";

export default async function Panel() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const admin = createSupabaseAdminClient();
  const { data: seller } = await admin.from("sellers").select("id,status,legal_name").eq("owner_user_id", user.id).maybeSingle();
  if (!seller || seller.status !== "active") redirect("/application-status");
  const { data: store } = await admin.from("stores").select("id,name,status").eq("seller_id", seller.id).in("status", ["active", "passive"]).maybeSingle();
  if (!store) redirect("/application-status");
  const displayName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : seller.legal_name;
  return <SellerShell store={{ name: store.name, status: store.status, displayName }}><SellerContent /></SellerShell>;
}
