import { createClient } from "@supabase/supabase-js";
import { databaseUrl, publishableKey } from "./config";
export function createAuthBrowserClient(){return createClient(databaseUrl,publishableKey)}
