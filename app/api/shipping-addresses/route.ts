import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";

export async function GET() {
  const supabase = await createSupabaseServerAuthClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("id, address, postal_code, city, country, last_used_at")
    .eq("user_id", user.id)
    .order("last_used_at", { ascending: false });

  if (error) {
    console.error("Unable to load shipping addresses:", error);
    return NextResponse.json({ error: "Unable to load addresses" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerAuthClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing address id" }, { status: 400 });

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Unable to delete shipping address:", error);
    return NextResponse.json({ error: "Unable to delete address" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
