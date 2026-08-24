import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";
export function createSupabaseAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Sunucu güvenlik yapılandırması eksik.");
  return createClient(supabaseUrl, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
