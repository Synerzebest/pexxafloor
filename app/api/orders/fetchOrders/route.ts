import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(["admin", "storekeeper", "delivery"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const statusQuery = searchParams.get("status");

  let query = supabaseServer
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // Si on a une query `status`
  if (statusQuery && statusQuery.length > 0) {
    const allowedStatuses = ["paid", "preparing", "verification", "packed", "ready", "delivering", "delivered", "cancelled"];
    const statuses = statusQuery.split(",").filter((status) => allowedStatuses.includes(status));
    if (statuses.length === 0) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    query = query.in("status", statuses);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((data || []).map((order) => order.user_id).filter(Boolean))];
  // profiles.company_name mirrors the latest PRO application (trigger pro_applications_sync_profile_company)
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabaseServer.from("profiles").select("id, company_name").in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileCompanies = new Map(
    (profiles || []).map((profile) => [profile.id, profile.company_name] as const)
  );
  const enrichedOrders = (data || []).map((order) => ({
    ...order,
    company_name: order.user_id ? profileCompanies.get(order.user_id) || null : null,
  }));

  return NextResponse.json({ data: enrichedOrders });
}
