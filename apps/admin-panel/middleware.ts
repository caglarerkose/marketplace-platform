import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/login";
  let isActiveAdmin = false;
  if (user) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    isActiveAdmin = Boolean(adminUser);
  }

  if ((!user || !isActiveAdmin) && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isActiveAdmin && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api/admin/login|_next/static|_next/image|favicon.ico|img/).*)"],
};
