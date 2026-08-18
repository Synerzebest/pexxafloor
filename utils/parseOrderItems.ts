import { StorekeeperProduct } from "@/types/StorekeeperProductType";

export function parseOrderItems(items: any): StorekeeperProduct[] {
  let raw: unknown;
  try {
    raw = typeof items === "string" ? JSON.parse(items) : items;
  } catch {
    return [];
  }

  if (!Array.isArray(raw)) return [];

  const products = new Map<string, StorekeeperProduct>();

  const addProduct = (product: StorekeeperProduct) => {
    const existing = products.get(product.id);
    if (existing) {
      existing.quantity_ordered += product.quantity_ordered;
      existing.total_price += product.total_price;
      if (!existing.image) existing.image = product.image;
      if (!existing.reference) existing.reference = product.reference;
      return;
    }
    products.set(product.id, product);
  };

  raw.forEach((item: any) => {
    if (Array.isArray(item?.products)) {
      const quantities = item.quantities || {};
      const packQuantity = Math.max(1, Number(item.quantity) || 1);
      item.products.forEach((p: any) => {
        const unitQuantity = Math.max(0, Number(quantities[p.id] ?? p.quantity ?? 1) || 0);
        addProduct({
          id: String(p.product_id || p.id || p.reference || p.name),
          description: p.description || p.name,
          total_price: Number(p.total_price || p.price || 0) * packQuantity,
          quantity_ordered: unitQuantity * packQuantity,
          image: p.image || p.image_url || null,
          reference: p.reference || null,
        });
      });
    } else {
      addProduct({
        id: String(item.product_id || item.id || item.reference || item.name),
        description: item.product?.name || item.name,
        total_price:
          Number(item.total_price || item.unit_price || item.product?.price || item.price || 0) *
          Math.max(1, Number(item.quantity) || 1),
        quantity_ordered: Math.max(1, Number(item.quantity) || 1),
        image: item.product?.image || item.image || item.image_url || null,
        reference: item.product?.reference || item.reference || null,
      });
    }
  });

  return Array.from(products.values()).filter((product) => product.quantity_ordered > 0);
}
