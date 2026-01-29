import packs from "@/constants/packs.json";

/* =========================
   Types
========================= */

export type TuyauType = "PERT" | "PERT-AL-PERT";
export type AgrafeType = 40 | 60;
export type IsolationType = 0 | 15 | 30;

export type Product = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  type?: string;
  height?: number;
  isolation?: number;
  packs?: number[];
  selectedQuantity?: number;
  image?: string;
};

export type ComputePackInput = {
  packNumber: number;
  surface: number;
  pasDePose: number;
  tuyauType: TuyauType;
  typeAgrafe: AgrafeType;
  typeIsolation: IsolationType;
};

export type ComputePackResult = {
  products: Product[];
  quantities: Record<string, number>;
  included: Product[];
  options: Product[];
  tubLength: number;
  circuitsNumber: number;
};

/* =========================
   Main function
========================= */

export function computePackProducts({
  packNumber,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  typeIsolation
}: ComputePackInput): ComputePackResult {
  const products: Product[] = [];
  const quantities: Record<string, number> = {};

  /* =========================
     Calculs globaux
  ========================= */

  const tubLength = (surface / pasDePose) * 100;
  const circuitsNumber = Math.ceil(tubLength / 100);
  const averagePerimeter = (surface / 2) * 1.5;

  /* =========================
     GROUPE 1
  ========================= */

  const g1 =
    packs.groupe1.find((p: Product) => p.quantity === circuitsNumber) ||
    packs.groupe1.find((p: Product) => p.quantity > circuitsNumber);

  if (g1 && g1.packs?.includes(packNumber)) {
    products.push(g1);
    quantities[g1.id] = 1;
  }

  /* =========================
     GROUPE 2 – TUYAUX
  ========================= */

  const tuyaux = packs.groupe2
    .filter(
      (p: Product) =>
        p.type === tuyauType && p.packs?.includes(packNumber)
    )
    .sort((a: Product, b: Product) => b.quantity - a.quantity);

  let remaining = tubLength;

  for (const roll of tuyaux) {
    if (remaining <= 0) break;

    const count = Math.floor(remaining / roll.quantity);
    if (count > 0) {
      products.push({ ...roll, selectedQuantity: count });
      quantities[roll.id] = count;
      remaining -= count * roll.quantity;
    }
  }

  if (remaining > 0 && tuyaux.length > 0) {
    const smallest = tuyaux[tuyaux.length - 1];
    const count = (quantities[smallest.id] || 0) + 1;

    quantities[smallest.id] = count;

    const existing = products.find((p) => p.id === smallest.id);
    if (existing) {
      existing.selectedQuantity = count;
    } else {
      products.push({ ...smallest, selectedQuantity: count });
    }
  }

  /* =========================
     GROUPE 3
  ========================= */

  packs.groupe3
    .filter((p: Product) => p.packs?.includes(packNumber))
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil(circuitsNumber);
    });

  /* =========================
     GROUPE 4
  ========================= */

  packs.groupe4
    .filter((p: Product) => p.packs?.includes(packNumber))
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil(2 * circuitsNumber);
    });

  /* =========================
     GROUPE 5
  ========================= */

  packs.groupe5
    .filter((p: Product) => p.packs?.includes(packNumber))
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil(averagePerimeter / p.quantity);
    });

  /* =========================
     GROUPE 6 – TREILLIS
  ========================= */

  const treillisType =
    pasDePose === 10 || pasDePose === 20 ? "10x10" : "15x15";

  const g6 = packs.groupe6.find(
    (p: Product) =>
      p.description.includes(treillisType) &&
      p.packs?.includes(packNumber)
  );

  if (g6) {
    products.push(g6);
    quantities[g6.id] = Math.ceil((1.1 * surface) / g6.quantity);
  }

  /* =========================
     GROUPE 7
  ========================= */

  packs.groupe7
    .filter((p: Product) => p.packs?.includes(packNumber))
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil((3 * tubLength) / p.quantity);
    });

  /* =========================
     GROUPE 8
  ========================= */

  packs.groupe8
    .filter((p: Product) => p.packs?.includes(packNumber))
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil(surface / p.quantity);
    });

  /* =========================
     GROUPE 9 – AGRAFES
  ========================= */

  packs.groupe9
    .filter(
      (p: Product) =>
        p.packs?.includes(packNumber) &&
        p.height === typeAgrafe
    )
    .forEach((p) => {
      products.push(p);
      quantities[p.id] = Math.ceil((3 * tubLength) / p.quantity);
    });

  /* =========================
     GROUPE 10 – NATTE
  ========================= */

  if (packNumber === 3) {
    const natte = packs.groupe10.find(
      (p: Product) =>
        p.packs?.includes(3) &&
        p.isolation === typeIsolation
    );
  
    if (natte) {
      products.push(natte);
      quantities[natte.id] = Math.ceil(surface / natte.quantity);
    }
  }

  /* =========================
     INCLUS
  ========================= */

  const included = packs.included.filter((p: Product) =>
    p.packs?.includes(packNumber)
  );

  included.forEach((p) => {
    quantities[p.id] = 1;
  });

  /* =========================
     OPTIONS
  ========================= */

  const options = packs.options.filter((p: Product) =>
    p.packs?.includes(packNumber)
  );

  /* =========================
     RESULT
  ========================= */

  return {
    products,
    quantities,
    included,
    options,
    tubLength,
    circuitsNumber,
  };
}
