import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole, type AppRole } from "@/lib/requireRole";
import { notifyOrder } from "@/lib/email/orderOutbox";

export function orderStatusHandler(roles: AppRole[], from: string[], to: string) {
  return async function POST(req: Request) {
    const auth = await requireRole(roles);
    if (!auth.ok) return auth.response;
    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const orderId = body?.order_id;
    if (typeof orderId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId)) {
      return NextResponse.json({ error: "Valid order_id required" }, { status: 400 });
    }
    const { data: order, error } = await supabaseServer.from("orders")
      .update({ status: to, validated_at: new Date().toISOString() })
      .eq("id", orderId).in("status", from).select("*").maybeSingle();
    if (error) {
      console.error("Order status update failed", { orderId, code: error.code });
      return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
    }
    if (!order) return NextResponse.json({ error: "Order not found or status already changed" }, { status: 409 });
    const notification = await notifyOrder(orderId);
    return NextResponse.json({ order, notification });
  };
}
