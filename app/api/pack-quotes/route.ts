import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import type { PackQuoteDraft, SavedPackQuote } from "@/context/QuoteContext";

type PackQuoteRow = {
  id: string;
  project_reference: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  project_type?: string | null;
  slug: string;
  pack_id?: string | null;
  surface: number;
  pas_de_pose: number;
  tuyau_type: "PERT" | "PERT-AL-PERT";
  type_agrafe: 40 | 60;
  type_isolation: 0 | 15 | 30;
  calepinage: boolean;
  quantities: Record<string, number>;
  selected_options?: Record<string, boolean> | null;
  products: SavedPackQuote["products"];
  total: number;
  updated_at: string;
};

function mapRow(row: PackQuoteRow): SavedPackQuote {
  return {
    id: row.id,
    quoteId: row.id,
    projectReference: row.project_reference,
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email || undefined,
    projectType: row.project_type || undefined,
    slug: row.slug,
    pack_id: row.pack_id || undefined,
    surface: Number(row.surface),
    pasDePose: Number(row.pas_de_pose),
    tuyauType: row.tuyau_type,
    typeAgrafe: Number(row.type_agrafe) as 40 | 60,
    typeIsolation: Number(row.type_isolation) as 0 | 15 | 30,
    calepinage: row.calepinage,
    quantities: row.quantities || {},
    selectedOptions: row.selected_options || {},
    products: row.products || [],
    total: Number(row.total),
    savedAt: row.updated_at,
  };
}

async function requireProUser() {
  const supabaseAuth = await createSupabaseServerAuthClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.is_pro !== true) {
    return { userId: user.id, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id, response: null };
}

export async function GET() {
  const auth = await requireProUser();
  if (auth.response) return auth.response;

  const { data, error } = await supabaseServer
    .from("pack_quotes")
    .select("*")
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json((data || []).map((row) => mapRow(row as PackQuoteRow)));
}

export async function POST(req: Request) {
  const auth = await requireProUser();
  if (auth.response) return auth.response;

  const body = (await req.json()) as PackQuoteDraft & {
    projectReference?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    projectType?: string;
  };

  if (!body.projectReference?.trim()) {
    return NextResponse.json(
      { error: "projectReference required" },
      { status: 400 }
    );
  }

  if (!body.slug || !body.surface || !body.pasDePose || !body.tuyauType) {
    return NextResponse.json({ error: "Invalid quote" }, { status: 400 });
  }

  const payload = {
    user_id: auth.userId,
    project_reference: body.projectReference.trim(),
    customer_name: body.customerName?.trim() || null,
    customer_phone: body.customerPhone?.trim() || null,
    customer_email: body.customerEmail?.trim() || null,
    project_type: body.projectType?.trim() || null,
    slug: body.slug,
    pack_id: body.pack_id || null,
    surface: body.surface,
    pas_de_pose: body.pasDePose,
    tuyau_type: body.tuyauType,
    type_agrafe: body.typeAgrafe,
    type_isolation: body.typeIsolation,
    calepinage: body.calepinage,
    quantities: body.quantities || {},
    selected_options: body.selectedOptions || {},
    products: body.products || [],
    total: body.total || 0,
  };

  const query = body.quoteId
    ? supabaseServer
        .from("pack_quotes")
        .update(payload)
        .eq("id", body.quoteId)
        .eq("user_id", auth.userId)
        .select()
        .single()
    : supabaseServer.from("pack_quotes").insert(payload).select().single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json(mapRow(data as PackQuoteRow));
}
