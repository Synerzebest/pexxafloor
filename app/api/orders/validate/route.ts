import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
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
        status: "validated",
        validated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
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
      message: "Order successfully validated",
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
