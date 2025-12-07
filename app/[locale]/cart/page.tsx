"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { Button, InputNumber, Empty } from "antd";
import { Navbar, Footer } from "@/components";
import { motion, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedDropdown from "@/components/ui/AnimatedDropdown";
import { getPackImage } from "@/utils/getPackImage";
import { LoadScript } from "@react-google-maps/api";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import type { User } from "@supabase/supabase-js";

type AddressSelection = {
  address: string;
  postalCode: string;
  city: string;
  country: string;
};


export default function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const supabase = createClientComponentClient();
  const locale = useLocale();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    loadUser();
  }, [supabase]);

  const total = items.reduce((acc, i) => {
    if (i.type === "product") return acc + (i.product?.price ?? 0) * i.quantity;
    if (i.type === "pack") return acc + i.total * i.quantity;
    return acc;
  }, 0);

  async function handleCheckout() {
    if (!user) return;

    if (!isAddressValid) {
      alert("Veuillez remplir l'adresse de livraison complète avant de continuer.");
      return;
    }

    if (!isClientNameValid) {
      alert("Veuillez indiquer le nom du client ou de l'entreprise.");
      return;
    }    
    
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        email: user?.email,
        user_id: user?.id,
        items,
        clientName,
        shipping: { address, postalCode, city, country, locale },
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 pb-44">
          <Empty description="Votre panier est vide" />
        </div>
        <Footer />
      </>
    );
  }

  const isClientNameValid = clientName.trim() !== "";
  const isAddressValid =
    address.trim() !== "" &&
    postalCode.trim() !== "" &&
    city.trim() !== "" &&
    country.trim() !== "";


  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Mon panier</h1>

        <ul className="space-y-5">
          <AnimatePresence>
            {items.map((item) => (
              <motion.li
                key={item.type === "product" ? item.product_id : item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-white shadow-md rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100"
              >
                {/* --- PRODUIT SIMPLE --- */}
                {item.type === "product" && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Image
                        src={item.product?.image || "/images/box.png"}
                        alt={item.product?.name || "Produit"}
                        width={90}
                        height={90}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold text-lg">
                          {item.product?.name}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {(item.product?.price ?? 0).toFixed(2)} €
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(val) =>
                          updateQuantity(item.product_id, val ? Number(val) : 1)
                        }
                      />
                      <span className="font-semibold w-20 text-right">
                        {((item.product?.price ?? 0) * item.quantity).toFixed(
                          2
                        )}{" "}
                        €
                      </span>
                      <Button
                        type="link"
                        danger
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- PACK PERSONNALISÉ --- */}
                {item.type === "pack" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Image
                          src={getPackImage(item.slug)}
                          alt="Pack personnalisé"
                          width={90}
                          height={90}
                          className="rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-lg">
                            Pack {item.slug}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.surface} m² · pas {item.pasDePose} cm ·{" "}
                            {item.tuyauType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(val) =>
                            updateQuantity(item.id, val ? Number(val) : 1)
                          }
                        />
                        <span className="font-semibold w-20 text-right">
                          {(item.total * item.quantity).toFixed(2)} €
                        </span>
                        <Button
                          type="link"
                          danger
                          onClick={() => removeFromCart(item.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    {/* --- Détails des produits inclus --- */}
                    <AnimatedDropdown title={`${item.products.length} produits inclus`} defaultOpen={false}>
                      <ul className="ml-2 mt-2 space-y-1 list-disc">
                        {item.products.map((p) => (
                          <li key={p.id}>
                            {p.description} — {p.unit_price.toFixed(2)} €
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/packs/${item.slug}?packId=${item.id}`}
                        className="inline-block mt-2 text-blue-600 hover:underline"
                      >
                        Modifier ce pack
                      </Link>
                    </AnimatedDropdown>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* --- NOM DU CLIENT / ENTREPRISE --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8"
        >
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Nom du client / entreprise
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: PexxaFloor"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                        shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                        transition-all outline-none bg-white"
            />
          </div>
        </motion.div>

        {/* --- ADRESSE DE LIVRAISON --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <AnimatedDropdown title="Adresse de livraison" defaultOpen={true}>
            <div className="bg-white p-5 mt-3 rounded-xl border border-gray-100 shadow-sm space-y-4">

              {/* Autocomplétion Google */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète
                </label>
                <LoadScript
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                  libraries={["places"]}
                >
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    onPlaceSelected={(data: AddressSelection) => {
                      setAddress(data.address);
                      setPostalCode(data.postalCode);
                      setCity(data.city);
                      setCountry(data.country);
                    }}
                  />
                </LoadScript>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                              shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                              transition-all outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bruxelles"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                              shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                              transition-all outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Belgique"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[15px]
                              shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                              transition-all outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </AnimatedDropdown>
        </motion.div>

        {/* --- TOTAL + CHECKOUT --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sticky bottom-0 bg-white mt-10 p-5 rounded-xl shadow-lg flex items-center justify-between border-t border-gray-100"
        >
          <div>
            <span className="text-lg font-semibold">Total :</span>
            <span className="ml-3 text-2xl font-bold">{total.toFixed(2)} €</span>
          </div>
          <Button
            type="primary"
            size="large"
            className="bg-orange-600 px-6 py-2 rounded-lg hover:bg-orange-700"
            onClick={handleCheckout}
            disabled={!user || !isClientNameValid || !isAddressValid}
          >
            Passer au paiement
          </Button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
