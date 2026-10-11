import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/requireRole";
import { notifyOrder } from "@/lib/email/orderOutbox";

const ORDER_STATUSES = ["paid", "preparing", "verification", "packed", "ready", "delivering", "delivered", "cancelled"];

// Admin override: move an order to any status. The customer email is queued by the
// orders status trigger, exactly like the step-by-step routes.
export async function POST(req: Request) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return auth.response;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = body?.order_id;
  const status = body?.status;
  if (typeof orderId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Valid order_id required" }, { status: 400 });
  }
  if (typeof status !== "string" || !ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: order, error } = await supabaseServer.from("orders")
    .update({ status, validated_at: new Date().toISOString() })
    .eq("id", orderId).neq("status", status).select("*").maybeSingle();
  if (error) {
    console.error("Order status override failed", { orderId, code: error.code });
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: "Order not found or already in this status" }, { status: 409 });

  const notification = await notifyOrder(orderId);
  return NextResponse.json({ order, notification });
}
