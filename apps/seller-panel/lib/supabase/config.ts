function requirePublicEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Veritabanı bağlantısı eksik: ${name}`);
  return value;
}
export const databaseUrl = requirePublicEnvironment("NEXT_PUBLIC_SUPABASE_URL");
export const publishableKey = requirePublicEnvironment("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
