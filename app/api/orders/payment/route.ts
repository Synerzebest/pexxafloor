import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/requireRole";

// Admin: record (or undo) the payment of an order, independently of its fulfilment status.
// Needed for PRO orders paid later, outside Stripe Checkout.
export async function POST(req: Request) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return auth.response;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = body?.order_id;
  const paid = body?.paid;
  if (typeof orderId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId)) {
    return NextResponse.json({ error: "Valid order_id required" }, { status: 400 });
  }
  if (typeof paid !== "boolean") {
    return NextResponse.json({ error: "paid must be a boolean" }, { status: 400 });
  }

  const { data: order, error } = await supabaseServer.from("orders")
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq("id", orderId).select("id, paid_at").maybeSingle();
  if (error) {
    console.error("Order payment update failed", { orderId, code: error.code });
    const missingColumn = ["PGRST204", "42703"].includes(error.code);
    return NextResponse.json(
      { error: missingColumn ? "Migration orders.paid_at non appliquée" : "Unable to update order" },
      { status: 500 }
    );
  }
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
