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
  const [{ data: applications, error: applicationsError }, { data: profiles, error: profilesError }] =
    userIds.length
      ? await Promise.all([
          supabaseServer
            .from("pro_applications")
            .select("user_id, company_name, created_at")
            .in("user_id", userIds)
            .order("created_at", { ascending: false }),
          supabaseServer
            .from("profiles")
            .select("id, company_name")
            .in("id", userIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

  if (applicationsError || profilesError) {
    return NextResponse.json(
      { error: applicationsError?.message || profilesError?.message },
      { status: 500 }
    );
  }

  const applicationCompanies = new Map<string, string>();
  for (const application of applications || []) {
    if (!applicationCompanies.has(application.user_id)) {
      applicationCompanies.set(application.user_id, application.company_name);
    }
  }
  const profileCompanies = new Map(
    (profiles || []).map((profile) => [profile.id, profile.company_name] as const)
  );
  const enrichedOrders = (data || []).map((order) => ({
    ...order,
    company_name: order.user_id
      ? applicationCompanies.get(order.user_id) || profileCompanies.get(order.user_id) || null
      : null,
  }));

  return NextResponse.json({ data: enrichedOrders });
}
