"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Collapse, InputNumber, Button, Spin, message, Radio } from "antd";
import Image from "next/image";
import { Navbar, Footer } from "@/components";
import { useCart } from "@/context/CartContext";
import { PackItem } from "@/context/CartContext";
import packs from "@/constants/packs.json";

type Product = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  type?: string;
  packs?: number[];
  selectedQuantity?: number;
  image?: string;
};

export default function PackPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { addToCart, items } = useCart();
  const packId = searchParams.get("packId");

  // Vérifie si on édite un pack existant
  const existingPack = items.find(
    (i): i is PackItem => i.type === "pack" && i.id === packId
  );  

  // slug → numéro du pack
  const packNumber =
    slug === "treillis" ? 1 : slug === "agrafe" ? 2 : slug === "natte" ? 3 : null;

  // États initiaux : si on édite un pack, on restaure sa config
  const [surface, setSurface] = useState(
    existingPack?.surface ?? parseFloat(searchParams.get("surface") || "100")
  );
  const [pasDePose, setPasDePose] = useState(existingPack?.pasDePose ?? 20);
  const [tuyauType, setTuyauType] = useState<"PERT" | "PERT-AL-PERT">(
    existingPack?.tuyauType ?? "PERT"
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [included, setIncluded] = useState<Product[]>([]);
  const [options, setOptions] = useState<Product[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [initialQuantities, setInitialQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const tuyauOptions = ["PERT", "PERT-AL-PERT"] as const;

  // Calculs principaux
  const tubLength = (surface / pasDePose) * 100;
  const circuitsNumber = Math.ceil(tubLength / 100);
  const averagePerimeter = (surface / 2) * 1.5;

  useEffect(() => {
    // Si on édite un pack existant, on le recharge et on arrête là
    if (existingPack) {
      const restoredProducts = existingPack.products.map((p) => ({
        id: p.id,
        description: p.description,
        price: p.unit_price,
      })) as Product[];

      setProducts(restoredProducts);
      setQuantities(existingPack.quantities);
      // Pour l'édition, restaurer les inclus et options à partir de la configuration globale
      const currentPackNumber =
        slug === "treillis" ? 1 : slug === "agrafe" ? 2 : slug === "natte" ? 3 : null;
      setIncluded(packs.included.filter((p: Product) => p.packs?.includes(currentPackNumber!)));
      setOptions(packs.options.filter((p: Product) => p.packs?.includes(currentPackNumber!)));
      
      // Restaurer les options sélectionnées
      const restoredOptions: Record<string, boolean> = {};
      packs.options
        .filter(p => p.packs?.includes(currentPackNumber!))
        .forEach(opt => {
          if (existingPack.products.some(ep => ep.id === opt.id)) {
            restoredOptions[opt.id] = true;
          }
        });
      setSelectedOptions(restoredOptions);
      
      setLoading(false);
      return;
    }

    // Sinon, recalcul complet depuis zéro
    if (!packNumber || !surface || !pasDePose) return;
    setLoading(true);

    const selectedProducts: Product[] = [];
    const q: Record<string, number> = {};

    // Groupe 1
    const g1 =
      packs.groupe1.find((p: Product) => p.quantity === circuitsNumber) ||
      packs.groupe1.find((p: Product) => p.quantity > circuitsNumber);
    if (g1 && g1.packs?.includes(packNumber)) {
      selectedProducts.push(g1);
      q[g1.id] = 1;
    }

    // Groupe 2 (tuyaux)
    const tuyaux = packs.groupe2
      .filter(
        (p: Product) => p.type === tuyauType && p.packs?.includes(packNumber)
      )
      .sort((a: Product, b: Product) => b.quantity - a.quantity);
    let remaining = tubLength;
    for (const roll of tuyaux) {
      if (remaining <= 0) break;
      const count = Math.floor(remaining / roll.quantity);
      if (count > 0) {
        selectedProducts.push({ ...roll, selectedQuantity: count });
        q[roll.id] = count;
        remaining -= count * roll.quantity;
      }
    }
    if (remaining > 0 && tuyaux.length > 0) {
      const smallest = tuyaux[tuyaux.length - 1];
      const count = (q[smallest.id] || 0) + 1;
      q[smallest.id] = count;
      const existing = selectedProducts.find((p) => p.id === smallest.id);
      if (existing) existing.selectedQuantity = count;
      else selectedProducts.push({ ...smallest, selectedQuantity: count });
    }

    // Groupes 3 à 10
    packs.groupe3
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil(circuitsNumber);
      });

    packs.groupe4
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil(2 * circuitsNumber);
      });

    packs.groupe5
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil(averagePerimeter / p.quantity);
      });

    const treillisType =
      pasDePose === 10 || pasDePose === 20 ? "10x10" : "15x15";
    const g6 = packs.groupe6.find(
      (p: Product) =>
        p.description.includes(treillisType) && p.packs?.includes(packNumber)
    );
    if (g6) {
      selectedProducts.push(g6);
      q[g6.id] = Math.ceil((1.1 * surface) / g6.quantity);
    }

    packs.groupe7
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil((3 * tubLength) / p.quantity);
      });

    packs.groupe8
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil(surface / p.quantity);
      });

    packs.groupe9
      .filter((p: Product) => p.packs?.includes(packNumber))
      .forEach((p) => {
        selectedProducts.push(p);
        q[p.id] = Math.ceil((3 * tubLength) / p.quantity);
      });

    if (packNumber === 3) {
      packs.groupe10
        .filter((p: Product) => p.packs?.includes(3))
        .forEach((p) => {
          selectedProducts.push(p);
          q[p.id] = Math.ceil(surface / p.quantity);
        });
    }

    // Produits inclus
    const inc = packs.included.filter((p: Product) =>
      p.packs?.includes(packNumber)
    );
    inc.forEach((p) => (q[p.id] = 1));

    // Options
    const opt = packs.options.filter((p: Product) =>
      p.packs?.includes(packNumber)
    );

    setIncluded(inc);
    setOptions(opt);
    setProducts(selectedProducts);
    setQuantities(q);
    setInitialQuantities(q);
    setLoading(false);
  }, [surface, pasDePose, packNumber, tuyauType]);

  // Calcul du total
  const totalPrice = useMemo(() => {
    let total = 0;
    for (const item of products) {
      total += (quantities[item.id] || 0) * item.price;
    }
    for (const id in selectedOptions) {
      if (selectedOptions[id]) {
        const opt = options.find((o) => o.id === id);
        if (opt) total += opt.price;
      }
    }
    for (const inc of included) {
      total += inc.price;
    }
    return total;
  }, [products, quantities, selectedOptions, included, options]);

  if (!packNumber)
    return <div className="p-10 text-center text-red-600">Pack introuvable</div>;

  if (loading)
    return (
      <div className="p-10 text-center">
        <Spin size="large" />
      </div>
    );

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
              Pack {slug?.[0]?.toUpperCase() + slug?.slice(1)}
        </h1>
        {existingPack && (
          <div className="mb-6 text-sm text-orange-700 bg-orange-100 p-3 rounded-lg border border-orange-200">
            Vous modifiez un pack déjà présent dans votre panier.
          </div>
        )}

        {/* Grille principale : Galerie (1/3) | Contenu + Prix (2/3) */}
        <div className="grid gap-10 lg:grid-cols-3">
          
          {/* COLONNE 1 (lg:col-span-1) : GALERIE */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 self-start bg-white p-4 rounded-xl border border-gray-100">
              <div className="flex flex-col items-center">
                
                {/* Image principale - Petite et centrale */}
                <div className="w-full max-w-[300px] mb-4">
                  <Image
                    src={selectedImage || products[0]?.image || "/images/box.png"}
                    alt="Image du pack"
                    width={300}
                    height={200}
                    className="rounded-lg w-full h-auto object-contain"
                  />
                </div>

                {/* Miniatures */}
                <div className="mt-2 grid grid-cols-4 gap-2 max-w-[300px] w-full">
                  {products.filter(p => p.image).slice(0, 4).map((p, idx) => (
                    <div key={p.id}>
                      <Image
                        src={p.image || "/images/box.png"}
                        alt={p.description}
                        width={70}
                        height={70}
                        className={`rounded-md cursor-pointer object-cover w-full h-16 border transition-all duration-200 ${
                          selectedImage === p.image || (!selectedImage && idx === 0)
                            ? "border-orange-600 ring-1 ring-orange-500"
                            : "border-gray-200 hover:border-orange-400"
                        }`}
                        onClick={() => setSelectedImage(p.image || "/images/box.png")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE 2 (lg:col-span-2) : CONFIGURATION + COMPOSANTS + PRIX EN BAS */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-8">
              
                {/* 1. Configuration (Pas de pose, Tuyau, Surface) */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Paramètres du pack</h2>
                    
                  <div className="md:flex md:gap-6 space-y-6 md:space-y-0">
                      {/* Pas de pose */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pas de pose
                        </label>

                        <div className="flex gap-2">
                          {[20, 15, 10].map((val) => (
                            <button
                              key={val}
                              onClick={() => setPasDePose(val)}
                              className={`
                                px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                                ${pasDePose === val 
                                  ? "bg-orange-500 border-orange-500 text-white" 
                                  : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"}
                              `}
                            >
                              {val} cm
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Type de tuyau */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de tuyau
                        </label>

                        <div className="flex gap-2">
                          {tuyauOptions.map((val) => (
                            <button
                              key={val}
                              onClick={() => setTuyauType(val)}
                              className={`
                                px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                                ${tuyauType === val
                                  ? "bg-orange-500 border-orange-500 text-white"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"}
                              `}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Surface */}
                    <div className="flex-1 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                        Surface à chauffer <span className="font-semibold text-gray-500">(Tuyau estimé : {Math.ceil(tubLength)} m)</span>
                        </label>

                        <div className="flex items-center gap-2">
                        <InputNumber
                            min={1}
                            value={surface}
                            onChange={(val) => setSurface(Number(val))}
                            size="large"
                            className="w-24 rounded-lg"
                        />
                        <span className="text-gray-500 text-base">m²</span>
                        </div>
                    </div>
                </div>


                {/* 2. Produits ajustables (Collapse) */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">Composants Ajustables</h2>
                    <Collapse
                    className="border-none [&_.ant-collapse-item]:border-b [&_.ant-collapse-item-last]:border-b-0"
                    accordion
                    items={products.map((item) => {
                        const qty = quantities[item.id] ?? 1;
                        const isModified = initialQuantities[item.id] !== qty;

                        return {
                        key: item.id,
                        label: (
                            <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                                <Image
                                src={item.image || "/images/box.png"}
                                alt={item.description}
                                width={30}
                                height={30}
                                className="rounded-md border border-gray-200"
                                />
                                <div>
                                <p className="font-medium text-gray-700 leading-tight">
                                    {item.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Prix unitaire : {item.price.toFixed(2)} €
                                </p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 text-right">
                                <span className={isModified ? 'text-orange-600' : 'text-gray-900'}>
                                    {qty}
                                </span>{" "}
                                x {item.price.toFixed(2)} € ={" "}
                                <span className="font-bold">
                                    {(qty * item.price).toFixed(2)} €
                                </span>
                            </p>
                            </div>
                        ),
                        children: (
                            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <div className="flex items-center gap-3">
                                <InputNumber
                                min={1}
                                value={qty}
                                onChange={(val) =>
                                    setQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.ceil(val || 1),
                                    }))
                                }
                                size="middle"
                                className="w-24"
                                />
                                {isModified && (
                                <Button
                                    size="small"
                                    type="default"
                                    onClick={() =>
                                    setQuantities((prev) => ({
                                        ...prev,
                                        [item.id]: initialQuantities[item.id],
                                    }))
                                    }
                                    className="border-orange-400 text-orange-600 hover:border-orange-500 hover:text-orange-700"
                                >
                                    Réinitialiser ({initialQuantities[item.id]})
                                </Button>
                                )}
                            </div>
                            </div>
                        ),
                        };
                    })}
                    />
                </div>
                
                {/* 3. Inclus */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">Inclus dans le pack</h2>
                    <ul className="space-y-3">
                        {included.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-800 text-sm font-medium">{item.description}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 4. Options */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h2 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-3">Options disponibles (Ajouter)</h2>
                    <div className="flex flex-col gap-3">
                        {options.map((opt) => {
                        const checked = selectedOptions[opt.id] || false;
                        return (
                            <label
                            key={opt.id}
                            className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition duration-300 ${
                                checked
                                ? "border-orange-500 bg-orange-50"
                                : "border-gray-200 hover:border-orange-400 hover:bg-gray-50"
                            }`}
                            >
                            <div className="flex items-center gap-3">
                                <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                    setSelectedOptions((prev) => ({
                                    ...prev,
                                    [opt.id]: e.target.checked,
                                    }))
                                }
                                className="w-5 h-5 accent-orange-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-800">{opt.description}</span>
                            </div>
                            <span className="font-bold text-gray-700 whitespace-nowrap text-sm">
                                + {opt.price.toFixed(2)} €
                            </span>
                            </label>
                        );
                        })}
                    </div>
                </div>

            </div>
            
            {/* 5. TOTAL / CTA (En bas de la colonne 2 sur desktop) */}
            <div className="mt-8 pt-6 bg-white p-6 rounded-xl border-orange-200 hidden lg:block">
                <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-gray-900">Total à payer :</span>
                        <span className="text-3xl font-extrabold text-orange-600">
                            {totalPrice.toFixed(2)} €
                        </span>
                    </div>
                    
                    <Button
                        type="primary"
                        size="large"
                        className="w-full h-12 bg-orange-600 border-none hover:bg-orange-700 font-bold text-lg rounded-xl"
                        onClick={() => {
                            addToCart({
                                type: "pack",
                                id: existingPack?.id || `pack-${Date.now()}`,
                                slug,
                                surface,
                                pasDePose,
                                tuyauType,
                                quantities,
                                products: [
                                    ...products,
                                    ...included,
                                    ...options.filter((o) => selectedOptions[o.id]),
                                ].map((p) => ({
                                    id: p.id,
                                    description: p.description,
                                    unit_price: p.price,
                                    total_price: p.price * (quantities[p.id] ?? 1),
                                })),
                                total: totalPrice,
                                quantity: 1,
                            });
                            message.success(
                                existingPack ? "Pack mis à jour dans le panier" : "Pack ajouté au panier"
                            );
                        }}
                    >
                        {existingPack ? "Mettre à jour le panier" : "Ajouter au panier"}
                    </Button>
                </div>
            </div>
          </div>
        </div>
        
        {/* TOTAL FIXE SUR MOBILE (Visible uniquement sur les petits écrans) */}
      </section>
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 lg:hidden z-40">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div className="text-base font-bold text-gray-900">
            Total : <span className="text-orange-600 text-xl">{totalPrice.toFixed(2)} €</span>
          </div>
          <Button
            type="primary"
            size="large"
            className="bg-orange-600 border-none hover:bg-orange-700 font-bold rounded-lg"
            onClick={() => {
                addToCart({
                    type: "pack",
                    id: existingPack?.id || `pack-${Date.now()}`,
                    slug,
                    surface,
                    pasDePose,
                    tuyauType,
                    quantities,
                    products: [
                      ...products,
                      ...included,
                      ...options.filter((o) => selectedOptions[o.id]),
                    ].map((p) => ({
                      id: p.id,
                      description: p.description,
                      unit_price: p.price,
                      total_price: p.price * (quantities[p.id] ?? 1),
                    })),
                    total: totalPrice,
                    quantity: 1,
                  });
                message.success(
                    existingPack ? "Pack mis à jour dans le panier" : "Pack ajouté au panier"
                );
            }}
          >
            {existingPack ? "Mettre à jour" : "Ajouter au panier"}
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}