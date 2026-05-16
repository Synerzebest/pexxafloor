import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { computeDbPackProducts } from "@/utils/packDbCalculations";
import { fetchPackBySlug } from "@/utils/packRepository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function POST(req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const surface = Number(body.surface);
    const pasDePose = Number(body.pasDePose);

    if (!surface || surface <= 0 || !pasDePose || pasDePose <= 0) {
      return new Response("Configuration invalide", { status: 400 });
    }

    const { pack, error } = await fetchPackBySlug(supabaseServer, slug);

    if (error || !pack) {
      console.error("Pack introuvable:", error);
      return new Response("Pack introuvable", { status: 404 });
    }

    const result = computeDbPackProducts({
      pack,
      surface,
      pasDePose,
      tuyauType: body.tuyauType as "PERT" | "PERT-AL-PERT",
      typeAgrafe: Number(body.typeAgrafe) as 40 | 60,
      typeIsolation: Number(body.typeIsolation) as 0 | 15 | 30,
      selectedOptions: body.selectedOptions || {},
    });

    return NextResponse.json({
      pack: {
        id: pack.id,
        slug: pack.slug,
        name_fr: pack.name_fr,
        name_nl: pack.name_nl,
        name_en: pack.name_en,
      },
      ...result,
    });
  } catch (err) {
    console.error("Erreur calcul pack:", err);
    return new Response("Erreur serveur", { status: 500 });
  }
}
