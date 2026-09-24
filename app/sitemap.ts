import type { MetadataRoute } from "next";
import { publicCatalog } from "@/lib/seo/catalog";
import { absoluteUrl, localizedPath, languageAlternates, locales } from "@/lib/seo/metadata";

export const revalidate = 3600;
type Row = { id: string; slug: string; category_id?: string; subcategory_id?: string; subsub_id?: string | null };
async function rows(table: string, columns: string): Promise<Row[]> {
  const result: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = publicCatalog().from(table).select(columns).order("id").range(offset, offset + 499);
    if (table === "packs") query = query.eq("active", true);
    const { data, error } = await query;
    if (error) throw new Error(`Sitemap: unable to read ${table}`);
    const page = data as unknown as Row[];
    result.push(...page);
    if (page.length < 500) return result;
  }
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, subs, subsubs, products, packs] = await Promise.all([
    rows("categories", "id, slug"), rows("subcategories", "id, slug, category_id"),
    rows("subsubcategories", "id, slug, subcategory_id"),
    rows("products", "id, slug, subcategory_id, subsub_id"), rows("packs", "id, slug"),
  ]);
  const paths = new Set(["", "categories", "quote", "pro", "legal", "privacy", "terms", "cookies", "withdrawal"]);
  const categoryPaths = new Map(categories.map(row => [row.id, `categories/${encodeURIComponent(row.slug)}`]));
  const subPaths = new Map<string, string>();
  for (const row of subs) {
    const parent = categoryPaths.get(row.category_id!);
    if (parent) subPaths.set(row.id, `${parent}/${encodeURIComponent(row.slug)}`);
  }
  const subsubMap = new Map(subsubs.map(row => [row.id, row]));
  for (const path of categoryPaths.values()) paths.add(path);
  for (const path of subPaths.values()) paths.add(path);
  for (const row of subsubs) {
    const parent = subPaths.get(row.subcategory_id!);
    if (parent) paths.add(`${parent}/${encodeURIComponent(row.slug)}`);
  }
  for (const row of products) {
    const parent = subPaths.get(row.subcategory_id!);
    const subsub = row.subsub_id ? subsubMap.get(row.subsub_id) : null;
    if (!parent || (row.subsub_id && (!subsub || subsub.subcategory_id !== row.subcategory_id))) continue;
    paths.add(`${parent}/${encodeURIComponent(subsub?.slug || "default")}/${encodeURIComponent(row.slug)}`);
  }
  for (const pack of packs) paths.add(`packs/${encodeURIComponent(pack.slug)}`);
  return [...paths].flatMap(path => locales.map(locale => ({
    url: absoluteUrl(localizedPath(locale, path)), alternates: { languages: languageAlternates(path) },
  })));
}
