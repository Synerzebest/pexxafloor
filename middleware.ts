import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const intlMiddleware = createMiddleware(routing);

// Règles par route
const ACCESS_RULES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/storekeeper": ["admin", "storekeeper"],
  "/delivery": ["admin", "delivery"],
};

// 🧠 Enlève la locale du path : /fr/admin/users → /admin/users
function stripLocale(pathname: string) {
  const parts = pathname.split("/");
  if (["fr", "nl", "en"].includes(parts[1])) {
    return "/" + parts.slice(2).join("/");
  }
  return pathname;
}

export async function middleware(req: NextRequest) {
  const rawPath = req.nextUrl.pathname;
  const path = stripLocale(rawPath);

  // Trouve le préfixe protégé : /admin, /delivery, /storekeeper
  const protectedPrefix = Object.keys(ACCESS_RULES).find(prefix =>
    path.startsWith(prefix)
  );

  if (!protectedPrefix) {
    return intlMiddleware(req);
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // PAS CONNECTÉ → login locale
  if (!session) {
    const locale = rawPath.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  // Charger le rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", session.user.id)
    .single();

  const userRole = profile?.user_role;

  if (!userRole) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const allowed = ACCESS_RULES[protectedPrefix];

  // Vérification des permissions
  if (!allowed.includes(userRole)) {
    const locale = rawPath.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
