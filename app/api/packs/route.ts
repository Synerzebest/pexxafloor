import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("packs")
    .select(`
      id,
      slug,
      name_fr,
      name_nl,
      name_en,
      image_url,
      installation_ease,
      installation_speed,
      price_level,
      installation_height_fr,
      installation_height_nl,
      installation_height_en,
      insulation_fr,
      insulation_nl,
      insulation_en,
      sort_order
    `)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Erreur chargement packs:", error);
    return new Response("Erreur packs", { status: 500 });
  }

  return NextResponse.json(data || []);
}
