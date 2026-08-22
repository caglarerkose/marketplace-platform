import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { databaseUrl, publishableKey } from "./config";
export async function createAuthServerClient(){const store=await cookies(),auth=createClient(databaseUrl,publishableKey,{auth:{autoRefreshToken:false,persistSession:false}}),access=store.get("be_seller_access")?.value,refresh=store.get("be_seller_refresh")?.value;if(access&&refresh)await auth.auth.setSession({access_token:access,refresh_token:refresh});return auth}
