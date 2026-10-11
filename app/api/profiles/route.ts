import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  let query = supabaseServer
    .from("profiles")
    .select("id, email, user_role, name, company_name, is_pro, created_at");

  const term = search.trim().replace(/[,()]/g, " ");
  if (term !== "") {
    query = query.or(`email.ilike.%${term}%,name.ilike.%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // profiles only stores a full name; PRO applications hold the first/last name split
  const ids = (data || []).map((profile) => profile.id);
  const { data: applications } = ids.length
    ? await supabaseServer
        .from("pro_applications")
        .select("user_id, first_name, last_name, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };
  const namesByUser = new Map<string, { first_name: string; last_name: string }>();
  for (const application of applications || []) {
    if (!namesByUser.has(application.user_id) && (application.first_name || application.last_name)) {
      namesByUser.set(application.user_id, application);
    }
  }

  return NextResponse.json(
    (data || []).map((profile) => {
      const application = namesByUser.get(profile.id);
      const [first = "", ...rest] = String(profile.name || "").trim().split(/\s+/);
      return {
        ...profile,
        first_name: application?.first_name || first || null,
        last_name: application?.last_name || rest.join(" ") || null,
      };
    })
  );
}
