import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

function getSecretKey() {
  const value = process.env.SUPABASE_SECRET_KEY;
  if (!value) {
    throw new Error("Sunucu veritabanı bağlantısı eksik: SUPABASE_SECRET_KEY");
  }
  return value;
}

const secretKey = getSecretKey();

export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
