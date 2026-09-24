import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { notFound } from "next/navigation";
import { pageMetadata, pageCopy, seoLocale } from "./metadata";

// Public catalogue only: no service key, cookies or customer-specific prices.
export function publicCatalog() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
export type NamedRow = { id: string; slug: string; name_fr: string; name_nl: string; name_en: string };
export const nameFor = (row: NamedRow, locale: string) => row[`name_${seoLocale(locale)}`] || row.name_fr || row.slug;
export const categoryRecord = cache(async (table: "categories" | "subcategories" | "subsubcategories", slug: string, parentId?: string) => {
  let query = publicCatalog().from(table).select("id, slug, name_fr, name_nl, name_en").eq("slug", slug);
  if (parentId) query = query.eq(table === "subcategories" ? "category_id" : "subcategory_id", parentId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Unable to load public ${table}`);
  if (!data) notFound();
  return data as NamedRow;
});
export async function categoryMetadata(params: {locale:string; category:string; subcategory?:string; subsubcategory?:string}) {
  const { locale, category, subcategory, subsubcategory } = params;
  let record = await categoryRecord("categories", category);
  const segments = ["categories", category];
  if (subcategory) { record = await categoryRecord("subcategories", subcategory, record.id); segments.push(subcategory); }
  if (subsubcategory) { record = await categoryRecord("subsubcategories", subsubcategory, record.id); segments.push(subsubcategory); }
  const name = nameFor(record, locale);
  return pageMetadata(locale, segments.map(encodeURIComponent).join("/"), name, pageCopy[seoLocale(locale)].category(name));
}
export const packRecord = cache(async (slug:string) => {
  const { data, error } = await publicCatalog().from("packs").select("id, slug, name_fr, name_nl, name_en, image_url").eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw new Error("Unable to load public pack");
  if (!data) notFound();
  return data as NamedRow & { image_url?: string };
});
