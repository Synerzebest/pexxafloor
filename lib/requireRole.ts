import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { supabaseServer } from "@/lib/supabaseServer";

export type AppRole = "admin" | "storekeeper" | "delivery" | "client" | "collaborator";

export async function requireRole(allowedRoles: AppRole[]) {
  const supabaseAuth = await createSupabaseServerAuthClient();
  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("isadmin, role, user_role")
    .eq("id", user.id)
    .maybeSingle();

  const legacyAdmin = profile?.isadmin === true || profile?.role === "ADMIN";
  const role: AppRole | null = legacyAdmin
    ? "admin"
    : (profile?.user_role as AppRole | null) || null;

  if (profileError || !role || !allowedRoles.includes(role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user, role };
}

export const requireAdmin = () => requireRole(["admin"]);
