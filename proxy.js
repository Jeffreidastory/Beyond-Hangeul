import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = ["/dashboard", "/profile", "/lessons", "/admin", "/modules", "/worksheets", "/path", "/goal", "/resources"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/BHadmin24"];

export async function proxy(request) {
  const pendingCookies = new Map();

  const applyPendingCookies = (targetResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      targetResponse.cookies.set(name, value, options);
    });

    return targetResponse;
  };

  const redirectWithAuthCookies = (pathname) => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname;
    return applyPendingCookies(NextResponse.redirect(redirectUrl));
  };

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.set(name, { name, value, options });
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
  const isAuthRoute = AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
  const isAdminRoute = ADMIN_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

  if (!user && isProtected) {
    return redirectWithAuthCookies("/auth/login");
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdminUser = profile?.role === "admin";

    if (!isAdminUser) {
      return redirectWithAuthCookies("/dashboard");
    }

    return response;
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (profile?.role !== "admin") {
      return redirectWithAuthCookies("/dashboard");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/lessons/:path*",
    "/admin/:path*",
    "/modules/:path*",
    "/worksheets/:path*",
    "/path/:path*",
    "/goal/:path*",
    "/resources/:path*",
    "/auth/:path*",
  ],
};
