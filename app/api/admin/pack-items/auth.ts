import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabaseServer";

export async function requireAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, response: new Response("Unauthorized", { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("isadmin, role, user_role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.isadmin === true ||
    profile?.role === "ADMIN" ||
    profile?.user_role === "admin";

  if (profileError || !isAdmin) {
    return { ok: false as const, response: new Response("Forbidden", { status: 403 }) };
  }

  return { ok: true as const, user };
}
