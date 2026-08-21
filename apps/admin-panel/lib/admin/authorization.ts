import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorizedAdmin = {
  userId: string;
  userCode: string;
  isSuperAdmin: boolean;
};

export async function requireAuthorizedAdmin(
  requiredPermission?: "view" | "support" | "product_approval",
): Promise<AuthorizedAdmin | null> {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;

  const adminClient = createSupabaseAdminClient();
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("user_id,user_code,is_super_admin,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!adminUser) return null;

  if (requiredPermission && !adminUser.is_super_admin) {
    const { data: permission } = await adminClient
      .from("admin_user_permissions")
      .select("permission_code")
      .eq("user_id", user.id)
      .eq("permission_code", requiredPermission)
      .maybeSingle();
    if (!permission) return null;
  }

  return {
    userId: adminUser.user_id,
    userCode: adminUser.user_code,
    isSuperAdmin: adminUser.is_super_admin,
  };
}
