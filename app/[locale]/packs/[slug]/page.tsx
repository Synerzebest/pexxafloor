"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Navbar, Footer, ProBadge } from "@/components";
import { useCart, PackItem } from "@/context/CartContext";
import { useState } from "react";

import { usePackConfig } from "@/hooks/usePackConfig";
import { usePackProducts } from "@/hooks/usePackProducts";
import { usePackTotal } from "@/hooks/usePackTotal";

import { PackGallery } from "@/components/pack/PackGallery";
import { PackConfigForm } from "@/components/pack/PackConfigForm";
import { PackProductsCollapse } from "@/components/pack/PackProductsCollapse";
import { PackIncluded } from "@/components/pack/PackIncluded";
import { PackOptions } from "@/components/pack/PackOptions";
import { PackTotalBox } from "@/components/pack/PackTotalBox";
import { PackMobileFooter } from "@/components/pack/PackMobileFooter";
import { PackCalepinageOption } from "@/components/pack/PackCalepinageOption";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`} />
  );
}

function PackPageSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 relative top-24 space-y-4 pb-36">
      <SkeletonBlock className="h-10 w-52 md:w-64" />

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-4">
          <SkeletonBlock className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-5">
            <SkeletonBlock className="h-7 w-44" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
            <SkeletonBlock className="h-7 w-56" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-8 w-8 rounded-md" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-48 max-w-[55vw]" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                </div>
                <SkeletonBlock className="h-5 w-20" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
            <SkeletonBlock className="h-7 w-40" />
            {Array.from({ length: 2 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-12 w-full rounded-lg" />
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-8 w-36" />
              </div>
              <SkeletonBlock className="h-11 w-40 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PackPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId");

  const { items, addToCart } = useCart();

  const existingPack = items.find(
    (i): i is PackItem => i.type === "pack" && i.id === packId
  );
  const [calepinage, setCalepinage] = useState<boolean>(
    existingPack?.calepinage ?? false
  );

  // Configuration 
  const {
    surface,
    pasDePose,
    tuyauType,
    typeAgrafe,
    typeIsolation,
    setSurface,
    setPasDePose,
    setTuyauType,
    setTypeAgrafe,
    setTypeIsolation
  } = usePackConfig(existingPack, searchParams.get("surface"));

  // Produits, options et quantités
  const {
    packId: dbPackId,
    products,
    included,
    options,
    quantities,
    setQuantities,
    initialQuantities,
    selectedOptions,
    setSelectedOptions,
    isInitialLoading,
    isRecalculating,
    error,
  } = usePackProducts({
    slug,
    surface,
    pasDePose,
    tuyauType,
    typeAgrafe,
    typeIsolation,
    existingPack,
  });

  // Total
  const total = usePackTotal({
    products,
    quantities,
    options,
    selectedOptions,
  });

  const galleryProducts = [
    ...products,
    ...included,
    ...options.filter((option) => selectedOptions[option.id]),
  ];

  const handleAddToCart = () => {
    addToCart({
      type: "pack",
      id: existingPack?.id || `pack-${Date.now()}`,
      pack_id: dbPackId || existingPack?.pack_id,
      slug,
      surface,
      pasDePose,
      tuyauType,
      typeIsolation,
      typeAgrafe,
      calepinage,
      quantities,
      selectedOptions,
      products: [
        ...products,
        ...included,
        ...options.filter((o) => selectedOptions[o.id]),
      ].map((p) => ({
        id: p.id,
        pack_item_id: p.pack_item_id,
        product_id: p.product_id,
        description: p.description,
        unit_price: p.price,
        image: p.image,
        reference: p.reference,
        total_price: p.price * (quantities[p.id] ?? 1),
      })),
      total,
      quantity: existingPack?.quantity || 1,
    });
  };

  if (error && products.length === 0) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <>
        <Navbar />
        <ProBadge />
        <PackPageSkeleton />
        <Footer />
      </>
    );
  }

  function getName(slug: string) {
    if (slug === "natte") return "plaques à plots"
    else if (slug === "treillis") return "treillis"
    else if (slug === "agrafe") return "agrafe"
    return ""
  }

  return (
    <>
      <Navbar />
      <ProBadge />

      <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 relative top-24 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Pack {getName(slug)}
        </h1>

        {existingPack && (
          <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded-lg border border-orange-200">
            Vous modifiez un pack déjà présent dans votre panier.
          </div>
        )}

        {error && (
          <div
            className="text-sm p-3 rounded-lg border text-red-700 bg-red-50 border-red-200"
          >
            {error}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          {/* COLONNE GAUCHE */}
          <PackGallery products={galleryProducts} />

          {/* COLONNE DROITE */}
          <div className="lg:col-span-2 space-y-8">
            <PackConfigForm
              slug={slug}
              surface={surface}
              pasDePose={pasDePose}
              tuyauType={tuyauType}
              typeAgrafe={typeAgrafe}
              typeIsolation={typeIsolation}
              onSurfaceChange={setSurface}
              onPasDePoseChange={setPasDePose}
              onTuyauTypeChange={setTuyauType}
              onTypeAgrafeChange={setTypeAgrafe}
              onTypeIsolationChange={setTypeIsolation}
            />

            <PackProductsCollapse
              products={products}
              quantities={quantities}
              initialQuantities={initialQuantities}
              setQuantities={setQuantities}
            />

            <PackIncluded included={included} />

            <PackOptions
              options={options}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
            />

            <PackCalepinageOption
              calepinage={calepinage}
              setCalepinage={setCalepinage}
            />

            <PackTotalBox
              total={total}
              onAddToCart={handleAddToCart}
              isEditing={!!existingPack}
              disabled={isRecalculating}
            />
          </div>
        </div>
      </section>

      <PackMobileFooter
        total={total}
        onAddToCart={handleAddToCart}
        isEditing={!!existingPack}
        disabled={isRecalculating}
      />

      <Footer />
    </>
  );
}
