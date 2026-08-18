import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/pack-items/auth";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const search = new URL(req.url).searchParams.get("search")?.trim() || "";
  let profilesQuery = supabaseServer
    .from("profiles")
    .select("id, email, name, company_name")
    .eq("is_pro", true)
    .order("name", { ascending: true });

  if (search) {
    const escaped = search.replace(/[,%()]/g, " ");
    profilesQuery = profilesQuery.or(
      `email.ilike.%${escaped}%,name.ilike.%${escaped}%,company_name.ilike.%${escaped}%`
    );
  }

  const [{ data: users, error: usersError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      profilesQuery,
      supabaseServer
        .from("categories")
        .select("id, name_fr, name_nl, name_en, discount")
        .order("name_fr", { ascending: true }),
    ]);

  if (usersError || categoriesError) {
    return NextResponse.json(
      { error: usersError?.message || categoriesError?.message },
      { status: 500 }
    );
  }

  const userIds = (users || []).map((user) => user.id);
  const { data: discounts, error: discountsError } = userIds.length
    ? await supabaseServer
        .from("pro_category_discounts")
        .select("user_id, category_id, discount_percent")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (discountsError) {
    return NextResponse.json({ error: discountsError.message }, { status: 500 });
  }

  return NextResponse.json({ users: users || [], categories: categories || [], discounts: discounts || [] });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    userId?: string;
    discounts?: Array<{ categoryId: string; discountPercent: number | null }>;
  };
  if (!body.userId || !Array.isArray(body.discounts)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: proUser } = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("id", body.userId)
    .eq("is_pro", true)
    .maybeSingle();
  if (!proUser) return NextResponse.json({ error: "PRO user not found" }, { status: 404 });

  for (const item of body.discounts) {
    if (!item.categoryId) continue;
    if (item.discountPercent === null) {
      const { error } = await supabaseServer
        .from("pro_category_discounts")
        .delete()
        .eq("user_id", body.userId)
        .eq("category_id", item.categoryId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      continue;
    }

    const value = Number(item.discountPercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: "Discount must be between 0 and 100" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("pro_category_discounts").upsert(
      {
        user_id: body.userId,
        category_id: item.categoryId,
        discount_percent: value,
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
