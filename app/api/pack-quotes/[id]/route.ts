import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { supabaseServer } from "@/lib/supabaseServer";

type Params = {
  params: Promise<{ id: string }>;
};

async function requireProUser() {
  const supabaseAuth = await createSupabaseServerAuthClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    return {
      userId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.is_pro !== true) {
    return {
      userId: user.id,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { userId: user.id, response: null };
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireProUser();
  if (auth.response) return auth.response;

  const { id } = await params;
  const { error } = await supabaseServer
    .from("pack_quotes")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
