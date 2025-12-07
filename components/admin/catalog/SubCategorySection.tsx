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
  Select,
  message,
  Space,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugInsert } from "@/hooks/slugInsert";
import type { Category } from "@/types/CategoryType";
import type { SubCategory } from "@/types/SubCategoryType";
import type { SubCategoryFormValues } from "@/types/SubCategoryFormValues";

interface Props {
  categories: Category[];
  subcategories: SubCategory[];
  fetchAll: () => void;
  supabase: SupabaseClient;
  loading: boolean;
}

export default function SubcategorySection({
  categories,
  subcategories,
  fetchAll,
  supabase,
  loading,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<SubCategory | null>(null);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [form] = Form.useForm();

  // --- AJOUT ---
  async function add(values:  SubCategoryFormValues) {
    const ok = await slugInsert(supabase, "subcategories", values);
    if (ok) {
      form.resetFields();
      setOpen(false);
      fetchAll();
    }
  }

  // --- MISE À JOUR ---
  async function update(values:  SubCategoryFormValues) {
    if (!editing) return;

    const { error } = await supabase
      .from("subcategories")
      .update({
        category_id: values.category_id,
        name_fr: values.name_fr,
        name_nl: values.name_nl,
        name_en: values.name_en,
        order: values.order ?? null,
      })
      .eq("id", editing.id);

    if (error) {
      message.error("Erreur lors de la mise à jour : " + error.message);
      return;
    }

    message.success("Sous-catégorie mise à jour !");
    setEditing(null);
    setOpen(false);
    form.resetFields();
    fetchAll();
  }

  // --- SUPPRESSION ---
  async function confirmDelete() {
    if (!deleting) return;

    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", deleting.id);

    if (error) {
      message.error("Erreur lors de la suppression : " + error.message);
      return;
    }

    message.success("Sous-catégorie supprimée !");
    setDeleting(null);
    setOpenDelete(false);
    fetchAll();
  }

  async function handleSubmit(values:  SubCategoryFormValues) {
    if (editing) await update(values);
    else await add(values);
  }

  return (
    <Card
      title="Sous-catégories"
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
        dataSource={subcategories}
        loading={loading}
        columns={[
          {
            title: "Catégorie",
            dataIndex: "category_id",
            render: (id: string) => {
              const cat = categories.find((c) => c.id === id);
              return cat ? cat.name_fr : id;
            },
          },
          { title: "FR", dataIndex: "name_fr" },
          { title: "NL", dataIndex: "name_nl" },
          { title: "EN", dataIndex: "name_en" },
          { title: "Ordre", dataIndex: "order" },
          {
            title: "Actions",
            render: (_, record: SubCategory) => (
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
            title={
              editing
                ? "Modifier la sous-catégorie"
                : "Ajouter une sous-catégorie"
            }
          >
            <motion.div
              key="modal-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
            >
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="category_id"
                  label="Catégorie"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name_fr,
                    }))}
                  />
                </Form.Item>

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
                Voulez-vous vraiment supprimer la sous-catégorie{" "}
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
