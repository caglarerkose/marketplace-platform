import { NextResponse } from "next/server";import { createAuthServerClient } from "@/lib/supabase/server";
export async function POST(request:Request){const auth=await createAuthServerClient();await auth.auth.signOut();const response=NextResponse.redirect(new URL("/login",request.url),303);response.cookies.delete("be_seller_access");response.cookies.delete("be_seller_refresh");return response}
