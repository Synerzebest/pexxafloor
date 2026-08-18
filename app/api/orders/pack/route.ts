import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: Request) {
  const auth = await requireRole(["admin", "storekeeper"]);
  if (!auth.ok) return auth.response;

  try {
    const supabase = supabaseServer;
    const body = await req.json();

    const { order_id } = body;
    if (!order_id) {
      return NextResponse.json(
        { error: "order_id required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "packed",
        validated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .in("status", ["preparing", "verification"])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Error while updating order" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Order is now packed",
      order: data[0],
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
