import "server-only";
import { createClient } from "@supabase/supabase-js";

function requireEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Seller Paneli veritabanı bağlantısı eksik: ${name}`);
  return value;
}

export function createSupabaseAdminClient() {
  return createClient(requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"), requireEnvironment("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
