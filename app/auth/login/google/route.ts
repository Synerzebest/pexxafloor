import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedNext = requestUrl.searchParams.get("next") || "/";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          cookieStore.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    return new Response("OAuth error", { status: 500 });
  }

  if (!data?.url) {
    return new Response("No redirect URL from provider", { status: 500 });
  }

  return Response.redirect(data.url);
}
