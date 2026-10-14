import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/requireRole";
import { notifyOrder } from "@/lib/email/orderOutbox";

// Admin workflow: an order moves one step forward or back along this path.
// "verification" is the storekeeper's sub-step of "preparing" and sits between preparing and packed.
const ORDER_PATH = ["paid", "preparing", "packed", "ready", "delivering", "delivered"] as const;
const PATH_POSITION: Record<string, number> = { ...Object.fromEntries(ORDER_PATH.map((s, i) => [s, i])), verification: 1 };

export async function POST(req: Request) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return auth.response;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = body?.order_id;
  const direction = body?.direction;
  const from = body?.from;
  if (typeof orderId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Valid order_id required" }, { status: 400 });
  }
  if (direction !== "next" && direction !== "previous") {
    return NextResponse.json({ error: "direction must be next or previous" }, { status: 400 });
  }
  const position = typeof from === "string" ? PATH_POSITION[from] : undefined;
  if (position === undefined) {
    return NextResponse.json({ error: "This status is outside the order path" }, { status: 409 });
  }
  const target = ORDER_PATH[direction === "next" ? position + 1 : from === "verification" ? 1 : position - 1];
  if (!target) return NextResponse.json({ error: "No status in this direction" }, { status: 409 });

  // Only applies if nobody changed the status meanwhile
  const { data: order, error } = await supabaseServer.from("orders")
    .update({ status: target, validated_at: new Date().toISOString() })
    .eq("id", orderId).eq("status", from).select("*").maybeSingle();
  if (error) {
    console.error("Order status move failed", { orderId, code: error.code });
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: "Order not found or status already changed" }, { status: 409 });

  if (direction === "next") {
    const notification = await notifyOrder(orderId);
    return NextResponse.json({ order, notification });
  }

  // Going back never emails the customer: the status trigger has just queued a
  // notification for the restored status, so it is marked handled without sending.
  const { error: skipError } = await supabaseServer.from("order_email_outbox")
    .update({ sent_at: new Date().toISOString(), locked_until: null, last_error: "skipped: status moved back by admin" })
    .eq("order_id", orderId).eq("payload->>status", target).is("sent_at", null);
  if (skipError) console.error("Unable to skip rollback notification", { orderId, code: skipError.code });

  return NextResponse.json({ order, notification: { sent: 0, failed: 0, pending: false } });
}
