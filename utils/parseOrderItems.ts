import { StorekeeperProduct } from "@/types/StorekeeperProductType";

export function parseOrderItems(items: any): StorekeeperProduct[] {
  const raw = typeof items === "string" ? JSON.parse(items) : items;

  const list: StorekeeperProduct[] = [];

  raw.forEach((item: any) => {
    if (item.products) {
      const quantities = item.quantities || {};
      item.products.forEach((p: any) =>
        list.push({
          id: p.product_id || p.id || p.name,
          description: p.description || p.name,
          total_price: p.total_price || p.price,
          quantity_ordered: quantities[p.id] ?? p.quantity ?? 1,
        })
      );
    } else {
      list.push({
        id: item.id || item.name,
        description: item.name,
        total_price: item.price,
        quantity_ordered: item.quantity ?? 1,
      });
    }
  });

  return list;
}
