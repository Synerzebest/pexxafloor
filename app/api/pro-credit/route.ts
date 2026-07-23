import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseAuth = await createSupabaseServerAuthClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error } = await supabaseServer
    .from("pro_credit_accounts")
    .select("balance_cents, total_granted_cents, total_used_cents")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    balanceCents: Number(account?.balance_cents || 0),
    totalGrantedCents: Number(account?.total_granted_cents || 0),
    totalUsedCents: Number(account?.total_used_cents || 0),
  });
}
