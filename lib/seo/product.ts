import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Product } from "@/types/ProductType";
import { publicCatalog, nameFor } from "./catalog";
import { absoluteUrl, localizedPath, pageMetadata, pageCopy, seoLocale, plainText } from "./metadata";

export const productRecord = cache(async (slug: string) => {
  const { data, error } = await publicCatalog().from("products").select(`
    id, slug, name_fr, name_nl, name_en, description_fr, description_nl, description_en, price, reference,
    product_images!fk_product (image_url),
    subcategory:subcategories (id, slug, name_fr, name_nl, name_en, category:categories (id, slug, name_fr, name_nl, name_en)),
    subsubcategory:subsubcategories!left (id, slug, name_fr, name_nl, name_en)
  `).eq("slug", slug).maybeSingle();
  if (error) throw new Error("Unable to load public product");
  if (!data) notFound();
  return data as unknown as Product;
});
export function productPath(product: Product) {
  return ["categories", product.subcategory.category.slug, product.subcategory.slug, product.subsubcategory?.slug || "default", product.slug].map(encodeURIComponent).join("/");
}
export async function productMetadata(params: {locale:string; product:string; category:string; subcategory:string; subsubcategory:string}) {
  const product = await productRecord(params.product);
  if (product.subcategory.category.slug !== params.category || product.subcategory.slug !== params.subcategory || (product.subsubcategory?.slug || "default") !== params.subsubcategory) notFound();
  const locale = seoLocale(params.locale);
  const name = nameFor(product, locale);
  const description = plainText(product[`description_${locale}`]) || pageCopy[locale].category(name);
  return pageMetadata(locale, productPath(product), name, description, product.product_images?.[0]?.image_url);
}
export function productStructuredData(product: Product, locale: string) {
  const name = nameFor(product, locale);
  const url = absoluteUrl(localizedPath(locale, productPath(product)));
  const category = product.subcategory.category;
  const subcategory = product.subcategory;
  const links = [
    { name: "PexxaFloor", path: "" },
    { name: nameFor(category, locale), path: `categories/${encodeURIComponent(category.slug)}` },
    { name: nameFor(subcategory, locale), path: `categories/${encodeURIComponent(category.slug)}/${encodeURIComponent(subcategory.slug)}` },
  ];
  if (product.subsubcategory) links.push({ name: nameFor(product.subsubcategory, locale), path: `categories/${encodeURIComponent(category.slug)}/${encodeURIComponent(subcategory.slug)}/${encodeURIComponent(product.subsubcategory.slug)}` });
  links.push({ name, path: productPath(product) });
  const price = Number(product.price);
  return {
    "@context": "https://schema.org", "@graph": [
      {
        "@type": "Product", "@id": `${url}#product`, name, url,
        description: plainText(product[`description_${seoLocale(locale)}`]) || undefined,
        image: product.product_images?.map(image => absoluteUrl(image.image_url)),
        sku: product.reference || undefined,
        // Prices in the DB exclude VAT; the public storefront displays 21% VAT.
        offers: Number.isFinite(price) && price >= 0 ? {
          "@type": "Offer", url, priceCurrency: "EUR", price: (Math.round(price * 1.21 * 100) / 100).toFixed(2),
          seller: { "@type": "Organization", name: "PexxaFloor", url: absoluteUrl("/") },
        } : undefined,
      },
      { "@type": "BreadcrumbList", itemListElement: links.map((link, index) => ({
        "@type": "ListItem", position: index + 1, name: link.name, item: absoluteUrl(localizedPath(locale, link.path)),
      })) },
    ],
  };
}
