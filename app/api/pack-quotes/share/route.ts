import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabaseServerAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import type { PackQuoteDraft } from "@/context/QuoteContext";
import { fetchPackBySlug } from "@/utils/packRepository";
import { applyPackQuantityOverrides, computeDbPackProducts } from "@/utils/packDbCalculations";
import { getProPricingContext, resolveProDiscount } from "@/utils/proCategoryDiscounts";

type ShareLine = {
  id: string;
  description: string;
  quantity: number;
  reference?: string | null;
  proUnitPrice: number;
  customerUnitPrice: number;
  proTotal: number;
  customerTotal: number;
  discountPercent: number;
};

type QuoteIssuer = {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postcode?: string | null;
  town?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  vat?: string | null;
};

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

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
    .select("is_pro, name")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.is_pro !== true) {
    return {
      userId: user.id,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const { data: proApplication } = await supabaseServer
    .from("pro_applications")
    .select(
      "company_name, address_line1, address_line2, postcode, town, county, phone, email, vat"
    )
    .eq("user_id", user.id)
    .eq("status", "VERIFIED")
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    userId: user.id,
    proIssuer: {
      name:
        proApplication?.company_name ||
        profile?.name ||
        user.user_metadata?.full_name ||
        user.email ||
        "Installateur",
      addressLine1: proApplication?.address_line1,
      addressLine2: proApplication?.address_line2,
      postcode: proApplication?.postcode,
      town: proApplication?.town,
      country: proApplication?.county,
      phone: proApplication?.phone,
      email: proApplication?.email || user.email,
      vat: proApplication?.vat,
    } satisfies QuoteIssuer,
    response: null,
  };
}

export async function POST(req: Request) {
  const auth = await requireProUser();
  if (auth.response) return auth.response;

  const quote = (await req.json()) as PackQuoteDraft;

  if (!quote.slug || !quote.surface || !quote.pasDePose || !quote.tuyauType) {
    return NextResponse.json({ error: "Invalid quote" }, { status: 400 });
  }

  const { pack, error } = await fetchPackBySlug(supabaseServer, quote.slug);

  if (error || !pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const computedPack = computeDbPackProducts({
    pack,
    surface: Number(quote.surface),
    pasDePose: Number(quote.pasDePose),
    tuyauType: quote.tuyauType,
    typeAgrafe: Number(quote.typeAgrafe) as 40 | 60,
    typeIsolation: Number(quote.typeIsolation) as 0 | 15 | 30,
    selectedOptions: quote.selectedOptions || {},
  });

  const result = applyPackQuantityOverrides(computedPack, quote.quantities);
  const pricingContext = await getProPricingContext(supabaseServer, auth.userId);
  const selectedOptionIds = quote.selectedOptions || {};
  const allLines = [
    ...result.products,
    ...result.included,
    ...result.options.filter((option) => selectedOptionIds[option.id]),
  ];

  const ruleById = new Map((pack.pack_items || []).map((rule) => [rule.id, rule]));
  const lines: ShareLine[] = allLines.map((line) => {
    const rule = ruleById.get(line.id);
    const quantity = Number(result.quantities[line.id] || 1);
    const customerUnitPrice = Number(line.price || 0);
    const category = rule?.product?.subcategory?.category;
    const discountPercent = resolveProDiscount(
      category?.id,
      category?.discount,
      pricingContext
    );
    const proUnitPrice =
      discountPercent > 0
        ? customerUnitPrice * (1 - discountPercent / 100)
        : customerUnitPrice;

    return {
      id: line.id,
      description: line.description,
      reference: line.reference,
      quantity,
      proUnitPrice: roundMoney(proUnitPrice),
      customerUnitPrice: roundMoney(customerUnitPrice),
      proTotal: roundMoney(proUnitPrice * quantity),
      customerTotal: roundMoney(customerUnitPrice * quantity),
      discountPercent,
    };
  });

  lines.push(
    ...(quote.additionalItems || [])
      .filter((item) => item.label?.trim() && Number(item.amount) > 0)
      .map((item) => ({
        id: `additional-item:${item.id}`,
        description: item.label.trim(),
        reference: null,
        quantity: 1,
        proUnitPrice: 0,
        customerUnitPrice: roundMoney(Number(item.amount)),
        proTotal: 0,
        customerTotal: roundMoney(Number(item.amount)),
        discountPercent: 0,
      }))
  );

  const proTotal = roundMoney(lines.reduce((sum, line) => sum + line.proTotal, 0));
  const customerTotal = roundMoney(lines.reduce((sum, line) => sum + line.customerTotal, 0));

  return NextResponse.json({
    isPro: true,
    proIssuer: auth.proIssuer,
    packName: pack.name_fr,
    projectReference: quote.projectReference || null,
    customerName: quote.customerName || null,
    customerPhone: quote.customerPhone || null,
    customerEmail: quote.customerEmail || null,
    projectType: quote.projectType || null,
    lines,
    proTotal,
    customerTotal,
    margin: roundMoney(customerTotal - proTotal),
  });
}
