"use client";

import { Footer } from "@/components";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useFetchStoreData } from "@/hooks/useFetchStoreData";
import CategorySection from "@/components/admin/catalog/CategorySection";
import SubCategorySection from "@/components/admin/catalog/SubCategorySection";
import SubSubcategorySection from "@/components/admin/catalog/SubSubCategorySection";
import ProductSection from "@/components/admin/catalog/ProductSection";
import AdminBestSellerSection from "@/components/admin/catalog/AdminBestSellerSection";
import PackSection from "@/components/admin/catalog/PackSection";

const tabs = [
  { key: "categories", label: "Catégories" },
  { key: "subcategories", label: "Sous-catégories" },
  { key: "subsubcategories", label: "Sous-sous-catégories" },
  { key: "products", label: "Produits"},
  { key: "packs", label: "Packs" },
  { key: "bestsellers", label: "Best sellers" },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const {
    categories,
    subcategories,
    subsubcategories,
    products,
    loading,
    fetchAll,
    supabase,
  } = useFetchStoreData();

  return (
    <>
      <div className="p-6 pt-8">

        {/* --- MENU --- */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-2 text-sm md:text-base font-medium rounded-xl 
                  transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-orange-500"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* --- CONTENU --- */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === "categories" && (
              <motion.div
                key="cat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CategorySection
                  categories={categories}
                  fetchAll={fetchAll}
                  supabase={supabase}
                  loading={loading}
                />
              </motion.div>
            )}

            {activeTab === "subcategories" && (
              <motion.div
                key="subcat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SubCategorySection
                  categories={categories}
                  subcategories={subcategories}
                  fetchAll={fetchAll}
                  supabase={supabase}
                  loading={loading}
                />
              </motion.div>
            )}

            {activeTab === "subsubcategories" && (
              <motion.div
                key="subsub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SubSubcategorySection
                  categories={categories}
                  subcategories={subcategories}
                  subsubcategories={subsubcategories}
                  fetchAll={fetchAll}
                  supabase={supabase}
                  loading={loading}
                />
              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div
                key="prod"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ProductSection
                  categories={categories}
                  subcategories={subcategories}
                  subsubcategories={subsubcategories}
                  products={products}
                  fetchAll={fetchAll}
                  supabase={supabase}
                  loading={loading}
                />
              </motion.div>
            )}

            {activeTab === "bestsellers" && (
              <motion.div
                key="bestsellers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AdminBestSellerSection
                  products={products}
                  supabase={supabase}
                  fetchAll={fetchAll}
                />
              </motion.div>
            )}

            {activeTab === "packs" && (
              <motion.div
                key="packs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <PackSection products={products} supabase={supabase} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </>
  );
}
