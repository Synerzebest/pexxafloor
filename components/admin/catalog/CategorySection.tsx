"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { slugInsert } from "@/hooks/slugInsert";
import type { Category } from "@/types/CategoryType";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CategoryFormValues } from "@/types/CategoryFormValuesType";

export default function CategorySection({
  categories,
  fetchAll,
  supabase,
  loading,
}: {
  categories: Category[];
  fetchAll: () => void;
  supabase: SupabaseClient;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  // --- Ajout ---
  async function add(values: CategoryFormValues) {
    const ok = await slugInsert(supabase, "categories", values);
    if (ok) {
      form.resetFields();
      setOpen(false);
      fetchAll();
    }
  }

  // --- Mise à jour ---
  async function update(values: CategoryFormValues) {
    if (!editing) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name_fr: values.name_fr,
        name_nl: values.name_nl,
        name_en: values.name_en,
        order: values.order ?? null,
        discount: values.discount ?? null,
      })
      .eq("id", editing.id);

    if (error) {
      message.error("Erreur lors de la mise à jour : " + error.message);
      return;
    }

    message.success("Catégorie mise à jour !");
    setEditing(null);
    setOpen(false);
    form.resetFields();
    fetchAll();
  }

  // --- Suppression ---
  async function confirmDelete() {
    if (!deleting) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", deleting.id);

    if (error) {
      message.error("Erreur lors de la suppression : " + error.message);
      return;
    }

    message.success("Catégorie supprimée !");
    setDeleting(null);
    setOpenDelete(false);
    fetchAll();
  }

  async function handleSubmit(values: CategoryFormValues) {
    if (editing) await update(values);
    else await add(values);
  }

  return (
    <Card
      title="Catégories"
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
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
        dataSource={categories}
        loading={loading}
        columns={[
          { title: "FR", dataIndex: "name_fr" },
          { title: "NL", dataIndex: "name_nl" },
          { title: "EN", dataIndex: "name_en" },
          { title: "Ordre", dataIndex: "order" },
          { 
            title: "Remise", 
            dataIndex: "discount",
            render: d => d ? `${d}%` : "-"
          },          
          {
            title: "Actions",
            render: (_, record) => (
              <Space>
                <button 
                    className="bg-blue-500 text-white font-bold rounded-lg py-1 px-2 cursor-pointer hover:bg-blue-600 duration-300"
                    onClick={() => {
                        setEditing(record);
                        form.setFieldsValue(record);
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
        ]}
      />

      {/* --- MODALE AJOUT / MODIF --- */}
      <AnimatePresence>
        {open && (
          <Modal
            open={open}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
              form.resetFields();
            }}
            footer={null}
            destroyOnClose
            centered
            title={editing ? "Modifier la catégorie" : "Ajouter une catégorie"}
          >
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
            >
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="name_fr"
                  label="Nom (FR)"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="name_nl"
                  label="Nom (NL)"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="name_en"
                  label="Nom (EN)"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="order" label="Ordre">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="discount"
                  label="Remise (%)"
                  tooltip="Pour appliquer une remise à toute la catégorie et ses produits"
                  rules={[
                    { type: "number", min: 0, max: 100, message: "La remise doit être entre 0 et 100" }
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} placeholder="Ex: 10 pour 10%" />
                </Form.Item>


                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button type="primary" htmlType="submit" block>
                    {editing ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </motion.div>
              </Form>
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
                Voulez-vous vraiment supprimer la catégorie{" "}
                <b>{deleting.name_fr}</b> ?
              </p>
              <Space style={{ marginTop: 16, display: "flex", justifyContent: "start" }}>
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
