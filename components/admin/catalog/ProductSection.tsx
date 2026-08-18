"use client";

import { useMemo, useState } from "react";
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
      extra={
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
      }
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
