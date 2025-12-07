import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { user_role } = await req.json();

  const { error } = await supabaseServer
    .from("profiles")
    .update({ user_role })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
