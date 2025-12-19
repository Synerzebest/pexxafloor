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
  // 1. On laisse passer les routes d'authentification critiques
  if (
    req.nextUrl.pathname.startsWith("/auth/login") ||
    req.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  // 2. Initialiser la réponse avec l'internationalisation
  let response = intl(req);

  // 3. Créer le client Supabase
  // On utilise createServerClient pour synchroniser les cookies entre req et response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          // On recrée la réponse pour y injecter les nouveaux cookies de session
          response = intl(req);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 4. Rafraîchir la session (IMPORTANT : getUser est plus sûr que getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl;
  const rawPath = url.pathname;
  const path = stripLocale(rawPath);
  const locale = rawPath.split("/")[1] || routing.defaultLocale;

  // 5. Redirection si l'utilisateur est déjà connecté et tente d'aller sur login/signup
  if (user && (path === "/login" || path === "/signup")) {
    url.pathname = `/${locale}/profile`;
    return NextResponse.redirect(url);
  }

  // 6. Gestion des accès protégés (Admin, Storekeeper, etc.)
  const protectedPrefix = Object.keys(ACCESS_RULES).find((prefix) =>
    path.startsWith(prefix)
  );

  if (protectedPrefix) {
    // Si pas de session -> Redirection Login
    if (!user) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    // Récupération du rôle depuis la table profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    // Si pas de profil ou rôle insuffisant -> Redirection Home
    if (!profile || !ACCESS_RULES[protectedPrefix].includes(profile.user_role)) {
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // On exclut les fichiers statiques et les routes internes de Next.js
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};