import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function getCustomerEmailMap(admin: AdminClient) {
  const [sellersResult, applicationsResult, adminsResult, authResult] =
    await Promise.all([
      admin.from("sellers").select("owner_user_id"),
      admin
        .from("seller_applications")
        .select("applicant_user_id")
        .not("applicant_user_id", "is", null),
      admin.from("admin_users").select("user_id"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (
    sellersResult.error ||
    applicationsResult.error ||
    adminsResult.error ||
    authResult.error
  ) {
    throw new Error("customer_accounts_unavailable");
  }

  const excluded = new Set<string>();
  for (const seller of sellersResult.data || [])
    excluded.add(seller.owner_user_id);
  for (const application of applicationsResult.data || []) {
    if (application.applicant_user_id)
      excluded.add(application.applicant_user_id);
  }
  for (const panelUser of adminsResult.data || [])
    excluded.add(panelUser.user_id);

  return new Map(
    (authResult.data.users || [])
      .filter((user) => {
        if (excluded.has(user.id)) return false;
        const accountType = user.user_metadata?.account_type;
        return !accountType || accountType === "customer";
      })
      .map((user) => [user.id, user.email || ""]),
  );
}
