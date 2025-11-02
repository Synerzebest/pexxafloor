import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');     // code OAuth PKCE
  const next = url.searchParams.get('next') || '/';

  if (code) {
    const supabase = createRouteHandlerClient({cookies});
    // échange le code contre une session et pose les cookies sur ton domaine
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
