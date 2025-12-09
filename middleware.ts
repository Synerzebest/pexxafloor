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
  // Bypass middleware for OAuth routes
  if (
    req.nextUrl.pathname.startsWith("/auth/login") ||
    req.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // ⚠️ IMPORTANT : nouvel adapter cookies compatible Next 15
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.delete({ name, ...options });
        }
      }
    }
  );

  const url = req.nextUrl;
  const rawPath = url.pathname;
  const path = stripLocale(rawPath);
  const locale = rawPath.split("/")[1] || routing.defaultLocale;

  // Charger session Supabase
  const {
    data: { session }
  } = await supabase.auth.getSession();


  // 1. LOGIN / SIGNUP — si user connecté → redirect
  if (session && (path === "/login" || path === "/signup")) {
    url.pathname = `/${locale}/profile`;
    return NextResponse.redirect(url);
  }


  // 2. PAGES PROTÉGÉES
  const protectedPrefix = Object.keys(ACCESS_RULES).find(prefix =>
    path.startsWith(prefix)
  );

  if (protectedPrefix) {
    // Pas connecté → redirect login
    if (!session) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", session.user.id)
      .single();

    const role = profile?.user_role;

    if (!role || !ACCESS_RULES[protectedPrefix].includes(role)) {
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  // 3. Appliquer next-intl
  return intl(req);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|auth|.*\\..*).*)",
  ],
};

