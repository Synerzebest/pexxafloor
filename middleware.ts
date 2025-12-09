import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

const ACCESS_RULES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/storekeeper": ["admin", "storekeeper"],
  "/delivery": ["admin", "delivery"],
};

function stripLocale(pathname: string) {
  const parts = pathname.split("/");
  if (["fr", "nl", "en"].includes(parts[1])) {
    return "/" + parts.slice(2).join("/");
  }
  return pathname;
}

export async function middleware(req: NextRequest) {
  // -- BYPASS OAUTH ROUTES --
  if (
    req.nextUrl.pathname.startsWith("/auth/login") ||
    req.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  // IMPORTANT : ne pas créer res avant intl
  let response = intl(req);

  // Supabase session handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl;
  const rawPath = url.pathname;
  const path = stripLocale(rawPath);
  const locale = rawPath.split("/")[1] || routing.defaultLocale;

  // 1. LOGIN / SIGNUP redirect if logged in
  if (session && (path === "/login" || path === "/signup")) {
    url.pathname = `/${locale}/profile`;
    return NextResponse.redirect(url);
  }

  // 2. Protected pages
  const protectedPrefix = Object.keys(ACCESS_RULES).find((prefix) =>
    path.startsWith(prefix)
  );

  if (protectedPrefix) {
    if (!session) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !ACCESS_RULES[protectedPrefix].includes(profile.user_role)) {
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
