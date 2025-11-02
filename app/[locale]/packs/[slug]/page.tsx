"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Collapse, InputNumber, Button, Spin, message, Radio, Checkbox } from "antd";
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
      setIncluded([]);
      setOptions([]);
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
  }, [products, quantities, selectedOptions, included]);

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
      <section className="mx-auto max-w-6xl px-4 py-8">
        {existingPack && (
          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
            Vous modifiez un pack déjà présent dans votre panier.
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Galerie */}
          <div className="sticky top-24 self-start flex flex-col items-center">
            {products.length > 0 && (
              <>
                <div className="w-full max-w-[400px]">
                  <Image
                    src={selectedImage || products[0].image || "/images/box.png"}
                    alt="Image du pack"
                    width={500}
                    height={350}
                    className="rounded-lg shadow w-full h-auto object-contain bg-gray-50"
                  />
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2 max-w-[500px]">
                  {products.map((p, idx) => (
                    <div key={p.id}>
                      <Image
                        src={p.image || "/images/box.png"}
                        alt={p.description}
                        width={80}
                        height={80}
                        className={`rounded-lg cursor-pointer object-cover border transition-all duration-200 ${
                          selectedImage === p.image || (!selectedImage && idx === 0)
                            ? "border-orange-600 ring-2 ring-orange-500"
                            : "border-gray-200 hover:border-orange-400"
                        }`}
                        onClick={() => setSelectedImage(p.image || "/images/box.png")}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Configuration */}
          <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-800">
              Pack {slug?.charAt(0).toUpperCase() + slug?.slice(1)}
            </h1>

            {/* Pas de pose */}
            <div className="mb-6">
              <p className="mb-2 font-medium text-gray-700">Pas de pose</p>
              <Radio.Group
                value={pasDePose}
                onChange={(e) => setPasDePose(e.target.value)}
              >
                <Radio value={20}>20 cm</Radio>
                <Radio value={15}>15 cm</Radio>
                <Radio value={10}>10 cm</Radio>
              </Radio.Group>
            </div>

            {/* Type de tuyau */}
            <div className="mb-6">
              <p className="mb-2 font-medium text-gray-700">Type de tuyau</p>
              <Radio.Group
                value={tuyauType}
                onChange={(e) => setTuyauType(e.target.value)}
              >
                <Radio value="PERT">PERT</Radio>
                <Radio value="PERT-AL-PERT">PERT-AL-PERT</Radio>
              </Radio.Group>
            </div>

            {/* Surface */}
            <div className="mb-6 flex items-center gap-2">
              <InputNumber
                value={surface}
                min={1}
                onChange={(val) => setSurface(val || 0)}
              />
              <span className="text-gray-500">m²</span>
            </div>

            {/* Produits */}
            <Collapse
              className="[&_.ant-collapse-header]:bg-white [&_.ant-collapse-item-active_.ant-collapse-header]:bg-gray-50"
              accordion
              items={products.map((item) => {
                const qty = quantities[item.id] ?? 1;
                return {
                  key: item.id,
                  label: (
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.image || "/images/box.png"}
                        alt={item.description}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-700">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {qty} × {item.price.toFixed(2)} € ={" "}
                          {(qty * item.price).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ),
                  children: (
                    <div className="space-y-3">
                      <p>{item.description}</p>
                      <div className="flex items-center gap-2">
                        <InputNumber
                          min={1}
                          value={qty}
                          onChange={(val) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.ceil(val || 1),
                            }))
                          }
                        />
                        {initialQuantities[item.id] !== qty && (
                          <Button
                            size="small"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: initialQuantities[item.id],
                              }))
                            }
                          >
                            Revenir au calcul
                          </Button>
                        )}
                      </div>
                    </div>
                  ),
                };
              })}
            />

            {/* Inclus */}
            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-3">Inclus dans le pack</h2>
              <ul className="space-y-2">
                {included.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <span className="text-gray-800 text-sm font-medium">{item.description}</span>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {item.price.toFixed(2)} €
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Options */}
            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-3">Options disponibles</h2>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const checked = selectedOptions[opt.id] || false;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition ${
                        checked
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-gray-200 hover:border-orange-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [opt.id]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-orange-600"
                        />
                        <span className="text-sm font-medium text-gray-800">{opt.description}</span>
                      </div>
                      <span className="font-semibold text-gray-700 whitespace-nowrap">
                        {opt.price.toFixed(2)} €
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="mt-8 flex justify-between items-center border-t pt-4">
          <div className="text-lg font-bold text-gray-900">
            Total : {totalPrice.toFixed(2)} €
          </div>
          <Button
            type="primary"
            size="large"
            className="bg-orange-600"
            onClick={() => {
              addToCart({
                type: "pack",
                id: existingPack?.id || "",
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
      </section>
      <Footer />
    </>
  );
}
