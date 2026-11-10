import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { requireRole } from "@/lib/requireRole";
import { CUSTOMER_ADDRESS_EDITABLE_STATUSES } from "@/lib/orderAddress";

type Params = { params: Promise<{ id: string }> };

const FIELDS = { address: 500, postal_code: 30, city: 150, country: 100 } as const;

// Changes the delivery address of an order.
// Admin: any status except "delivered". Customer: own order, until it leaves the warehouse.
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, string> = {};
  for (const [field, max] of Object.entries(FIELDS)) {
    const value = typeof body[field] === "string" ? (body[field] as string).trim() : "";
    if (!value || value.length > max) {
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    }
    update[field] = value;
  }

  // Who is asking, before anything about the order is revealed
  const admin = await requireRole(["admin"]);
  let customerId: string | null = null;
  if (!admin.ok) {
    const supabaseAuth = await createSupabaseServerAuthClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    customerId = user.id;
  }

  const { data: order, error: orderError } = await supabaseServer
    .from("orders").select("id, user_id, status").eq("id", id).maybeSingle();
  if (orderError) return NextResponse.json({ error: "Unable to load order" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (admin.ok) {
    if (order.status === "delivered") {
      return NextResponse.json({ error: "Order already delivered" }, { status: 409 });
    }
  } else {
    // Same answer as "not found" so other customers' order ids are not revealed
    if (order.user_id !== customerId) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!CUSTOMER_ADDRESS_EDITABLE_STATUSES.includes(order.status)) {
      return NextResponse.json({ error: "Address can no longer be changed online" }, { status: 409 });
    }
  }

  // Status re-checked in the update itself, in case it changed meanwhile
  const { data: updated, error } = await supabaseServer.from("orders")
    .update(update)
    .eq("id", id)
    .eq("status", order.status)
    .select("id, address, postal_code, city, country, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update address" }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Order status changed, try again" }, { status: 409 });

  return NextResponse.json({ order: updated });
}
