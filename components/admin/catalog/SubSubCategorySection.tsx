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
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { slugInsert } from "@/hooks/slugInsert";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/CategoryType";
import type { SubCategory } from "@/types/SubCategoryType";
import type { SubSubCategory } from "@/types/SubSubCategoryType";
import type { SubSubFormValues } from "@/types/SubSubFormValuesType";
import type { ColumnsType } from "antd/es/table";

export default function SubSubcategorySection({
  categories,
  subcategories,
  subsubcategories,
  fetchAll,
  supabase,
  loading,
}: {
  categories: Category[];
  subcategories: SubCategory[];
  subsubcategories: SubSubCategory[];
  fetchAll: () => void;
  supabase: SupabaseClient;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<SubSubCategory | null>(null);
  const [editing, setEditing] = useState<SubSubCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [form] = Form.useForm<SubSubFormValues>();

  // AJOUT
  async function add(values: SubSubFormValues) {
    const { category_id, ...cleanValues } = values;

    const ok = await slugInsert(supabase, "subsubcategories", cleanValues);

    if (ok) {
      form.resetFields();
      setSelectedCategory(null);
      setOpen(false);
      fetchAll();
    }
  }

  // MISE À JOUR
  async function update(values: SubSubFormValues) {
    if (!editing) return;

    const { error } = await supabase
      .from("subsubcategories")
      .update({
        subcategory_id: values.subcategory_id,
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

    message.success("Sous-sous-catégorie mise à jour !");
    setEditing(null);
    setOpen(false);
    form.resetFields();
    fetchAll();
  }

  async function handleSubmit(values: SubSubFormValues) {
    if (editing) await update(values);
    else await add(values);
  }

  // SUPPRESSION
  async function confirmDelete() {
    if (!deleting) return;

    const { error } = await supabase
      .from("subsubcategories")
      .delete()
      .eq("id", deleting.id);

    if (error) {
      message.error("Erreur lors de la suppression : " + error.message);
      return;
    }

    message.success("Sous-sous-catégorie supprimée !");
    setDeleting(null);
    setOpenDelete(false);
    fetchAll();
  }

  // COLONNES
  const columns: ColumnsType<SubSubCategory> = [
    { title: "Nom", dataIndex: "name_fr" },
    {
      title: "Sous-catégorie parente",
      dataIndex: "subcategory_id",
      render: (id: string) => {
        const sub = subcategories.find((s) => s.id === id);
        const cat = sub
          ? categories.find((c) => c.id === sub.category_id)
          : null;

        return sub && cat ? `${cat.name_fr} > ${sub.name_fr}` : sub?.name_fr || id;
      },
    },
    { title: "NL", dataIndex: "name_nl" },
    { title: "EN", dataIndex: "name_en" },
    { title: "Ordre", dataIndex: "order" },
    {
      title: "Actions",
      render: (_: unknown, record: SubSubCategory) => (
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

              const sub = subcategories.find((s) => s.id === record.subcategory_id);
              setSelectedCategory(sub?.category_id ?? null);

              form.setFieldsValue({
                category_id: sub?.category_id ?? "",
                subcategory_id: record.subcategory_id,
                name_fr: record.name_fr,
                name_nl: record.name_nl,
                name_en: record.name_en,
                order: record.order ?? undefined,
              });              

              setOpen(true);
            }}
          />

          <Button
            danger
            size="small"
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
      ),
    },
  ];

  const orange = "#f97316";

  return (
    <Card
      title={
        <span style={{ fontWeight: 600, fontSize: "18px", color: orange }}>
          Sous-sous-catégories
        </span>
      }
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing(null);
            setSelectedCategory(null);
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
        dataSource={subsubcategories}
        columns={columns}
        loading={loading}
      />

      {/* MODALE FORM */}
      <AnimatePresence>
        {open && (
          <Modal
            className="product-modal"
            width="80%"
            open={open}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
              setSelectedCategory(null);
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
                {editing ? "Modifier la sous-sous-catégorie" : "Ajouter une sous-sous-catégorie"}
              </span>
            }
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Form<SubSubFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
                
                {/* Catégorie */}
                <Form.Item name="category_id" label="Catégorie" rules={[{ required: true }]}>
                  <Select
                    placeholder="Choisir une catégorie"
                    options={categories.map((c) => ({
                      label: c.name_fr,
                      value: c.id,
                    }))}
                    onChange={(val) => {
                      setSelectedCategory(val);
                      form.setFieldValue("subcategory_id", undefined);
                    }}
                  />
                </Form.Item>

                {/* Sous-catégorie */}
                <Form.Item name="subcategory_id" label="Sous-catégorie" rules={[{ required: true }]}>
                  <Select
                    disabled={!selectedCategory}
                    placeholder={
                      selectedCategory ? "Choisir une sous-catégorie" : "Choisir d'abord une catégorie"
                    }
                    options={subcategories
                      .filter((s) => s.category_id === selectedCategory)
                      .map((s) => ({
                        label: s.name_fr,
                        value: s.id,
                      }))}
                  />
                </Form.Item>

                {/* Champs noms */}
                <Form.Item name="name_fr" label="Nom (FR)" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="name_nl" label="Nom (NL)" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="name_en" label="Nom (EN)" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>

                <Form.Item name="order" label="Ordre">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block style={{ backgroundColor: orange, borderColor: orange, height: "48px" }}>
                  {editing ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </Form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* MODALE SUPPRESSION */}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>
                Voulez-vous vraiment supprimer{" "}
                <b>{deleting.name_fr}</b> ?
              </p>
              <Space style={{ marginTop: 16 }}>
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
