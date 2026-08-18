import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { supabaseServer } from "@/lib/supabaseServer";
import { parseOrderItems } from "@/utils/parseOrderItems";
import type { StorekeeperProduct } from "@/types/StorekeeperProductType";

type Params = { params: Promise<{ id: string }> };
type PickingAction = "save_progress" | "save_internal" | "start_verification" | "finish_verification";

function mergePickingState(items: unknown, saved: unknown): StorekeeperProduct[] {
  const expected = parseOrderItems(items);
  const savedById = new Map(
    (Array.isArray(saved) ? saved : []).map((item: StorekeeperProduct) => [String(item.id), item])
  );

  return expected.map((product) => {
    const state = savedById.get(product.id);
    return {
      ...product,
      picked_quantity: Math.min(
        product.quantity_ordered,
        Math.max(0, Number(state?.picked_quantity) || 0)
      ),
      verified_quantity: Math.min(
        product.quantity_ordered,
        Math.max(0, Number(state?.verified_quantity) || 0)
      ),
      isPicked: state?.isPicked === true,
    };
  });
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireRole(["admin", "storekeeper"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { data: order, error } = await supabaseServer
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({
    order,
    products: mergePickingState(order.items, order.picking_items),
    step: order.picking_step === "verification" ? "verification" : "picking",
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireRole(["admin", "storekeeper"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await req.json()) as {
    action?: PickingAction;
    products?: StorekeeperProduct[];
    internalNote?: string;
    internalComment?: string;
  };

  const { data: order, error: fetchError } = await supabaseServer
    .from("orders")
    .select("id, status, items, picking_items, picking_step")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.action === "save_internal") {
    const { error } = await supabaseServer
      .from("orders")
      .update({
        internal_note: String(body.internalNote || "").slice(0, 500),
        internal_comment: String(body.internalComment || "").slice(0, 4000),
      })
      .eq("id", id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true });
  }

  const products = mergePickingState(order.items, body.products || order.picking_items);
  const now = new Date().toISOString();

  if (body.action === "save_progress") {
    const { error } = await supabaseServer
      .from("orders")
      .update({ picking_items: products, picking_updated_at: now })
      .eq("id", id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true, products });
  }

  if (body.action === "start_verification") {
    const incomplete = products.some(
      (product) =>
        !product.isPicked || product.picked_quantity !== product.quantity_ordered
    );
    if (incomplete) {
      return NextResponse.json({ error: "Picking incomplete" }, { status: 400 });
    }
    if (!['preparing', 'verification'].includes(order.status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 409 });
    }
    const { error } = await supabaseServer
      .from("orders")
      .update({
        status: "verification",
        picking_step: "verification",
        picking_items: products,
        picking_updated_at: now,
      })
      .eq("id", id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true, products, step: "verification" });
  }

  if (body.action === "finish_verification") {
    const mismatch = products.some(
      (product) =>
        product.picked_quantity !== product.quantity_ordered ||
        product.verified_quantity !== product.quantity_ordered
    );
    if (mismatch) {
      return NextResponse.json({ error: "Verification incomplete" }, { status: 400 });
    }
    if (order.status !== "verification" || order.picking_step !== "verification") {
      return NextResponse.json({ error: "Invalid order status" }, { status: 409 });
    }
    const { error } = await supabaseServer
      .from("orders")
      .update({
        status: "packed",
        picking_step: "verification",
        picking_items: products,
        picking_updated_at: now,
      })
      .eq("id", id);
    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true, products });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
