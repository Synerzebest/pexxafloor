"use client";

import { useState } from "react";
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
import type { ProductWithSubSub } from "@/types/ProductWithSubSubType";

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
  products: ProductWithSubSub[];
  fetchAll: () => void;
  supabase: SupabaseClient;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<ProductWithSubSub | null>(null);
  const [editing, setEditing] = useState<ProductWithSubSub | null>(null);

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
    dataIndex?: keyof ProductWithSubSub;
    render?: (_: unknown, record: ProductWithSubSub) => React.ReactNode;
  }[] = [
    {
      title: "Image",
      dataIndex: "product_images",
      render: (_: unknown, record: ProductWithSubSub) =>
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
    {
      title: "Catégories",
      render: (_: unknown, record: ProductWithSubSub) => {
        // Sous-catégorie (obligatoire)
        const sub = subcategories.find(
          (s) => s.id === record.subcategory_id
        );
    
        if (!sub) return "-";
    
        // Catégorie
        const cat = categories.find(
          (c) => c.id === sub.category_id
        );
    
        // Sous-sous-catégorie (optionnelle)
        const subsub = record.subsub_id
          ? subsubcategories.find((ss) => ss.id === record.subsub_id)
          : null;
    
        return [
          cat?.name_fr,
          sub.name_fr,
          subsub?.name_fr,
        ]
          .filter(Boolean)
          .join(" > ");
      },
    },    
    { title: "Réf.", dataIndex: "reference" },
    { title: "FR", dataIndex: "name_fr" },
    { title: "Prix Brut (€)", dataIndex: "price" },
    {
      title: "Actions",
      render: (_: unknown, record: ProductWithSubSub) => (
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
      <Table
        rowKey="id"
        dataSource={products}
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
            destroyOnClose
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
