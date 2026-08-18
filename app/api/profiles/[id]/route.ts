import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin, type AppRole } from "@/lib/requireRole";

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { user_role } = await req.json();
  const allowedRoles: AppRole[] = ["admin", "storekeeper", "delivery", "client", "collaborator"];
  if (!allowedRoles.includes(user_role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("profiles")
    .update({ user_role })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
