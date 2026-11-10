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
  const [{ data: profiles, error: profilesError }, { data: applications }] = userIds.length
    ? await Promise.all([
        supabaseServer.from("profiles").select("id, company_name, is_pro, name, email").in("id", userIds),
        supabaseServer
          .from("pro_applications")
          .select("user_id, first_name, last_name, created_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [], error: null }, { data: [] }];

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile] as const));
  // First/last name: from the PRO application when there is one, else split the account's full name
  const applicationNames = new Map<string, { first_name: string; last_name: string }>();
  for (const application of applications || []) {
    if (!applicationNames.has(application.user_id)) applicationNames.set(application.user_id, application);
  }

  const enrichedOrders = (data || []).map((order) => {
    const profile = order.user_id ? profileById.get(order.user_id) : undefined;
    const application = order.user_id ? applicationNames.get(order.user_id) : undefined;
    const [first = "", ...rest] = String(profile?.name || "").trim().split(/\s+/);
    return {
      ...order,
      company_name: profile?.company_name || null,
      customer_is_pro: profile?.is_pro === true,
      customer_first_name: application?.first_name || first || null,
      customer_last_name: application?.last_name || rest.join(" ") || null,
      customer_email: profile?.email || null,
    };
  });

  return NextResponse.json({ data: enrichedOrders });
}
