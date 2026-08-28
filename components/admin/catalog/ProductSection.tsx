"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Space,
  message,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import ProductForm from "./ProductForm";
import type { Category } from "@/types/CategoryType";
import type { SubCategory } from "@/types/SubCategoryType";
import type { SubSubCategory } from "@/types/SubSubCategoryType";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/ProductType";
import CatalogSearch, { matchesCatalogSearch } from "./CatalogSearch";

const orange = "#f97316"; 

export default function ProductSection({
  categories,
  subcategories,
  subsubcategories,
  products,
  fetchAll,
  supabase,
  loading,
}: {
  categories: Category[];
  subcategories: SubCategory[];
  subsubcategories: SubSubCategory[];
  products: Product[];
  fetchAll: () => void;
  supabase: SupabaseClient;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>(products);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => setOrderedProducts(products), [products]);

  const productGroupKey = (product: Product) =>
    product.subsubcategory?.id || `subcategory:${product.subcategory.id}`;

  const orderGroups = useMemo(() => {
    const groups = new Map<string, { title: string; products: Product[] }>();
    for (const product of orderedProducts) {
      const key = productGroupKey(product);
      const title = [
        product.subcategory.category.name_fr,
        product.subcategory.name_fr,
        product.subsubcategory?.name_fr || "Produits directs",
      ].join(" › ");
      const group = groups.get(key) || { title, products: [] };
      group.products.push(product);
      groups.set(key, group);
    }
    return [...groups.entries()].map(([key, group]) => ({
      key,
      title: group.title,
      products: group.products.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));
  }, [orderedProducts]);

  function moveProduct(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const dragged = orderedProducts.find((product) => product.id === draggedId);
    const target = orderedProducts.find((product) => product.id === targetId);
    if (!dragged || !target || productGroupKey(dragged) !== productGroupKey(target)) return;

    const group = orderedProducts
      .filter((product) => productGroupKey(product) === productGroupKey(dragged))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const from = group.findIndex((product) => product.id === draggedId);
    const to = group.findIndex((product) => product.id === targetId);
    const reordered = [...group];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const positions = new Map(reordered.map((product, index) => [product.id, index]));
    setOrderedProducts((current) => current.map((product) =>
      positions.has(product.id) ? { ...product, sort_order: positions.get(product.id) } : product
    ));
  }

  async function saveProductOrder() {
    setSavingOrder(true);
    const updates = orderedProducts.map((product) =>
      supabase.from("products").update({ sort_order: product.sort_order ?? 0 }).eq("id", product.id)
    );
    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;
    setSavingOrder(false);
    if (error) return message.error("Impossible d’enregistrer l’ordre : " + error.message);
    message.success("Ordre d’affichage enregistré !");
    setOrderOpen(false);
    fetchAll();
  }

  const filteredProducts = useMemo(
    () => products.filter((product) => matchesCatalogSearch(search, [
      product.name_fr,
      product.name_nl,
      product.name_en,
      product.slug,
      product.reference,
      product.subcategory?.name_fr,
      product.subcategory?.name_nl,
      product.subcategory?.name_en,
      product.subcategory?.category?.name_fr,
      product.subcategory?.category?.name_nl,
      product.subcategory?.category?.name_en,
      product.subsubcategory?.name_fr,
      product.subsubcategory?.name_nl,
      product.subsubcategory?.name_en,
    ])),
    [products, search]
  );

  // --- SUPPRESSION ---
  async function confirmDelete() {
    if (!deleting) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleting.id);

    if (error) {
      message.error("Erreur lors de la suppression : " + error.message);
      return;
    }

    message.success("Produit supprimé !");
    setDeleting(null);
    setOpenDelete(false);
    fetchAll();
  }

  // --- COLONNES ---
  const columns: {
    title: string;
    dataIndex?: keyof Product;
    render?: (_: unknown, record: Product) => React.ReactNode;
  }[] = [
    { title: "Nom", dataIndex: "name_fr" },
    {
      title: "Chemin catalogue",
      render: (_: unknown, record: Product) => {
        const category = record.subcategory.category;
        const subcategory = record.subcategory;
        const subsub = record.subsubcategory;
    
        return [
          category.name_fr,
          subcategory.name_fr,
          subsub?.name_fr,
        ]
          .filter(Boolean)
          .join(" > ");
      },
    },        
    { title: "Prix Brut (€)", dataIndex: "price" },
    {
      title: "Image",
      dataIndex: "product_images",
      render: (_: unknown, record: Product) =>
        record.product_images?.length ? (
          <img
            src={record.product_images[0].image_url}
            alt="thumb"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : null,
    },
    { title: "Réf.", dataIndex: "reference" },
    {
      title: "Actions",
      render: (_: unknown, record: Product) => (
        <Space direction="horizontal">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
            style={{
              background: orange,
              borderColor: orange,
              color: "white",
              borderRadius: "6px",
            }}
          />
      
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setDeleting(record);
              setOpenDelete(true);
            }}
            style={{
              borderRadius: "6px",
            }}
          />
        </Space>
      )      
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontWeight: 600, fontSize: "18px", color: orange }}>
          Produits
        </span>
      }
      style={{
        borderRadius: "12px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        padding: "4px 12px",
      }}
      extra={<Space>
        <Button icon={<HolderOutlined />} onClick={() => setOrderOpen(true)}>
          Gérer l’ordre
        </Button>
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          style={{
            background: orange,
            borderColor: orange,
            color: "white",
            fontWeight: 600,
            padding: "0 18px",
            borderRadius: "8px",
          }}
        >
          Ajouter
        </Button>
      </Space>}
    >
      <CatalogSearch
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un produit par nom, référence, slug ou catégorie…"
        resultCount={filteredProducts.length}
        totalCount={products.length}
      />
      <Table
        rowKey="id"
        dataSource={filteredProducts}
        columns={columns}
        loading={loading}
        size="middle"
        style={{
          marginTop: "12px",
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
      />

      <Modal
        open={orderOpen}
        onCancel={() => { setOrderOpen(false); setOrderedProducts(products); }}
        title="Ordre d’affichage des produits"
        width={820}
        centered
        footer={[
          <Button key="cancel" onClick={() => { setOrderOpen(false); setOrderedProducts(products); }}>Annuler</Button>,
          <Button key="save" type="primary" loading={savingOrder} onClick={saveProductOrder} style={{ background: orange }}>Enregistrer l’ordre</Button>,
        ]}
      >
        <p className="mb-5 text-sm text-gray-500">Faites glisser les produits dans chaque groupe. L’ordre est appliqué aux pages du catalogue et aux résultats de recherche.</p>
        <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-2">
          {orderGroups.map((group) => (
            <section key={group.key}>
              <h3 className="sticky top-0 z-10 mb-2 bg-white py-2 text-sm font-semibold text-gray-700">{group.title}</h3>
              <div className="space-y-2">
                {group.products.map((product, index) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => setDraggedId(product.id)}
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveProduct(product.id)}
                    className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition active:cursor-grabbing ${draggedId === product.id ? "border-orange-400 opacity-50" : "border-gray-200 hover:border-orange-300"}`}
                  >
                    <HolderOutlined className="text-lg text-gray-400" />
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700">{index + 1}</span>
                    {product.product_images?.[0]?.image_url && <img src={product.product_images[0].image_url} alt="" className="h-10 w-10 rounded-lg object-contain" />}
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{product.name_fr}</p><p className="text-xs text-gray-500">{product.reference || "Sans référence"}</p></div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Modal>

      {/* --- MODALE AJOUT / MODIF --- */}
      <AnimatePresence>
        {open && (
          <Modal
            className="product-modal"
            open={open}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            footer={null}
            destroyOnHidden
            centered
            width="80%"
            styles={{
              wrapper: {
                paddingTop: 40,
                paddingBottom: 40,
              },
              header: { borderBottom: "none", paddingTop: 20 },
              content: { borderRadius: "12px", padding: "0 24px 24px" },
            }}
            
            title={
              <span style={{ fontWeight: 600, fontSize: "18px", color: orange }}>
                {editing ? "Modifier le produit" : "Ajouter un produit"}
              </span>
            }
          >
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
            >
              <ProductForm
                categories={categories}
                subcategories={subcategories}
                subsubcategories={subsubcategories}
                supabase={supabase}
                fetchAll={fetchAll}
                closeModal={() => {
                  setOpen(false);
                  setEditing(null);
                }}
                editing={editing}
              />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* --- MODALE SUPPRESSION --- */}
      <AnimatePresence>
        {openDelete && deleting && (
          <Modal
            open={openDelete}
            onCancel={() => {
              setOpenDelete(false);
              setDeleting(null);
            }}
            footer={null}
            destroyOnClose
            centered
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            >
              <p>
                Voulez-vous vraiment supprimer le produit{" "}
                <b>{deleting.name_fr}</b> ?
              </p>
              <Space
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "start",
                }}
              >
                <Button
                  onClick={() => setOpenDelete(false)}
                >
                  Annuler
                </Button>

                <Button
                  danger
                  type="primary"
                  onClick={confirmDelete}
                  style={{
                    background: "#dc2626",
                    borderColor: "#dc2626",
                    borderRadius: "6px",
                  }}
                >
                  Supprimer
                </Button>
              </Space>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </Card>
  );
}
