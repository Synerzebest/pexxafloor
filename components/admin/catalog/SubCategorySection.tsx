"use client";

import { useMemo, useState } from "react";
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
import CatalogSearch, { matchesCatalogSearch } from "./CatalogSearch";

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
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const filteredSubcategories = useMemo(
    () => subcategories.filter((subcategory) => {
      const parent = categories.find((category) => category.id === subcategory.category_id);
      return matchesCatalogSearch(search, [
        subcategory.name_fr,
        subcategory.name_nl,
        subcategory.name_en,
        subcategory.slug,
        parent?.name_fr,
        parent?.name_nl,
        parent?.name_en,
      ]);
    }),
    [categories, search, subcategories]
  );

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
  const orange = "#f97316";

  return (
    <Card
      title={
        <span style={{ fontWeight: 600, fontSize: "18px", color: orange }}>
          Sous-catégories
        </span>
      }
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
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
        placeholder="Rechercher une sous-catégorie ou sa catégorie parente…"
        resultCount={filteredSubcategories.length}
        totalCount={subcategories.length}
      />
      <Table
        rowKey="id"
        dataSource={filteredSubcategories}
        loading={loading}
        columns={[
          { title: "Nom", dataIndex: "name_fr" },
          {
            title: "Catégorie parente",
            dataIndex: "category_id",
            render: (id: string) => {
              const cat = categories.find((c) => c.id === id);
              return cat ? cat.name_fr : id;
            },
          },
          { title: "NL", dataIndex: "name_nl" },
          { title: "EN", dataIndex: "name_en" },
          { title: "Ordre", dataIndex: "order" },
          {
            title: "Actions",
            render: (_, record: SubCategory) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  style={{
                    background: orange,
                    borderColor: orange,
                    color: "white",
                    borderRadius: "6px",
                  }}
                  onClick={() => {
                    setEditing(record);
                    form.setFieldsValue(record);
                    setOpen(true);
                  }}
                />
                <Button
                  danger
                  size="small"
                  onClick={() => {
                    setDeleting(record);
                    setOpenDelete(true);
                  }}
                  icon={<DeleteOutlined />}
                  style={{
                    borderRadius: "6px",
                  }}
                />
              </Space>
            ),
          },
        ]}
      />

      {/* --- MODALE AJOUT / MODIF --- */}
      <AnimatePresence>
        {open && (
          <Modal
            className="product-modal"
            width="80%"
            open={open}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
              form.resetFields();
            }}
            footer={null}
            destroyOnClose
            centered
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
                {editing ? "Modifier la sous-catégorie" : "Ajouter une sous-catégorie"}
              </span>
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
                  <Button type="primary" htmlType="submit" block style={{ backgroundColor: orange, borderColor: orange, height: "48px" }}>
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
