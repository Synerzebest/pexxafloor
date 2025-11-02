import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const intlMiddleware = createMiddleware(routing);

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.includes('/admin')) {
    const supabase = createMiddlewareClient({ req, res: NextResponse.next() });

    // Session utilisateur
    const { data: { session } } = await supabase.auth.getSession();

    // Si pas connecté → login dans la bonne locale
    if (!session) {
      const [, locale] = req.nextUrl.pathname.split('/');
      const loginUrl = new URL(`/${locale || routing.defaultLocale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Vérifier isadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('isadmin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.isadmin) {
      const [, locale] = req.nextUrl.pathname.split('/');
      const homeUrl = new URL(`/${locale || routing.defaultLocale}`, req.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|auth|.*\\..*).*)'
};
