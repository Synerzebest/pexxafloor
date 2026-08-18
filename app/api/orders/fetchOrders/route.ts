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

  return NextResponse.json({ data });
}
