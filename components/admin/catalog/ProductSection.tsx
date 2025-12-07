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
      title: "Sous-sous-catégorie",
      dataIndex: "subsub_id",
      render: (_: unknown, record: ProductWithSubSub) => {
        const subsub = subsubcategories.find((s) => s.id === record.subsub_id);
        if (!subsub) return record.subsub_id;
        const parent = subcategories.find((s) => s.id === subsub.subcategory_id);
        return parent
          ? `${parent.name_fr} > ${subsub.name_fr}`
          : subsub.name_fr;
      },
    },
    { title: "FR", dataIndex: "name_fr" },
    { title: "Prix (€)", dataIndex: "price" },
    {
      title: "Actions",
      render: (_: unknown, record: ProductWithSubSub) => (
        <Space>
          <button
            className="bg-blue-500 text-white font-bold rounded-lg py-1 px-2 cursor-pointer hover:bg-blue-600 duration-300"
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          >
            <EditOutlined />
          </button>
          <button
            className="bg-red-500 text-white font-bold rounded-lg py-1 px-2 cursor-pointer hover:bg-red-600 duration-300"
            onClick={() => {
              setDeleting(record);
              setOpenDelete(true);
            }}
          >
            <DeleteOutlined />
          </button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Produits"
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
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
      />

      {/* --- MODALE AJOUT / MODIF --- */}
      <AnimatePresence>
        {open && (
          <Modal
            open={open}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            footer={null}
            destroyOnClose
            centered
            title={editing ? "Modifier le produit" : "Ajouter un produit"}
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
                <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
                <Button danger type="primary" onClick={confirmDelete}>
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
