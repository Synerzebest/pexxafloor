import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/pack-items/auth";
import { supabaseServer } from "@/lib/supabaseServer";

type TargetType = "category" | "subcategory" | "subsubcategory";
const targetColumn: Record<TargetType, string> = {
  category: "category_id",
  subcategory: "subcategory_id",
  subsubcategory: "subsubcategory_id",
};

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
        .select(`
          id, name_fr, name_nl, name_en, discount,
          subcategories (
            id, name_fr, name_nl, name_en,
            subsubcategories (
              id, name_fr, name_nl, name_en
            )
          )
        `)
        .order("name_fr", { ascending: true }),
    ]);

  if (usersError || categoriesError) {
    return NextResponse.json(
      { error: usersError?.message || categoriesError?.message },
      { status: 500 }
    );
  }

  const userIds = (users || []).map((user) => user.id);
  const { data: rows, error: discountsError } = userIds.length
    ? await supabaseServer
        .from("pro_category_discounts")
        .select("user_id, category_id, subcategory_id, subsubcategory_id, discount_percent")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (discountsError) {
    return NextResponse.json({ error: discountsError.message }, { status: 500 });
  }

  const discounts = (rows || []).flatMap((row) => {
    if (row.subsubcategory_id) return [{ user_id: row.user_id, target_type: "subsubcategory", target_id: row.subsubcategory_id, discount_percent: row.discount_percent }];
    if (row.subcategory_id) return [{ user_id: row.user_id, target_type: "subcategory", target_id: row.subcategory_id, discount_percent: row.discount_percent }];
    if (row.category_id) return [{ user_id: row.user_id, target_type: "category", target_id: row.category_id, discount_percent: row.discount_percent }];
    return [];
  });

  return NextResponse.json({ users: users || [], categories: categories || [], discounts });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    userId?: string;
    discounts?: Array<{
      targetType: TargetType;
      targetId: string;
      discountPercent: number | null;
    }>;
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

  const [{ data: categories }, { data: subcategories }, { data: subsubcategories }] = await Promise.all([
    supabaseServer.from("categories").select("id"),
    supabaseServer.from("subcategories").select("id"),
    supabaseServer.from("subsubcategories").select("id"),
  ]);
  const validTargets: Record<TargetType, Set<string>> = {
    category: new Set((categories || []).map((item) => item.id)),
    subcategory: new Set((subcategories || []).map((item) => item.id)),
    subsubcategory: new Set((subsubcategories || []).map((item) => item.id)),
  };

  for (const item of body.discounts) {
    if (!targetColumn[item.targetType] || !validTargets[item.targetType].has(item.targetId)) {
      return NextResponse.json({ error: "Invalid discount target" }, { status: 400 });
    }
    const column = targetColumn[item.targetType];

    if (item.discountPercent === null) {
      const { error } = await supabaseServer
        .from("pro_category_discounts")
        .delete()
        .eq("user_id", body.userId)
        .eq(column, item.targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      continue;
    }

    const value = Number(item.discountPercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: "Discount must be between 0 and 100" }, { status: 400 });
    }

    const { data: existing, error: updateError } = await supabaseServer
      .from("pro_category_discounts")
      .update({ discount_percent: value, updated_at: new Date().toISOString() })
      .eq("user_id", body.userId)
      .eq(column, item.targetId)
      .select("id")
      .maybeSingle();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (!existing) {
      const payload = {
        user_id: body.userId,
        category_id: item.targetType === "category" ? item.targetId : null,
        subcategory_id: item.targetType === "subcategory" ? item.targetId : null,
        subsubcategory_id: item.targetType === "subsubcategory" ? item.targetId : null,
        discount_percent: value,
        created_by: auth.user.id,
        updated_at: new Date().toISOString(),
      };
      const { error: insertError } = await supabaseServer
        .from("pro_category_discounts")
        .insert(payload);
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
