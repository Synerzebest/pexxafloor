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
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [form] = Form.useForm();

  // --- Ajout ---
  async function add(values: CategoryFormValues) {
    let imageUrl: string | null = null;
  
    if (fileList.length && fileList[0].originFileObj) {
      imageUrl = await uploadCategoryImage(
        fileList[0].originFileObj as File
      );
    }
  
    const ok = await slugInsert(supabase, "categories", {
      ...values,
      image_url: imageUrl,
    });
  
    if (ok) {
      form.resetFields();
      setFileList([]);
      setOpen(false);
      fetchAll();
    }
  }  

  // --- Mise à jour ---
  async function update(values: CategoryFormValues) {
    if (!editing) return;
  
    let imageUrl = editing.image_url ?? null;

    if (imageRemoved) {
      imageUrl = null;
    }
  
    if (fileList.length && fileList[0].originFileObj) {
      imageUrl = await uploadCategoryImage(
        fileList[0].originFileObj as File
      );
    }
  
    const { error } = await supabase
      .from("categories")
      .update({
        name_fr: values.name_fr,
        name_nl: values.name_nl,
        name_en: values.name_en,
        order: values.order ?? null,
        discount: values.discount ?? null,
        image_url: imageUrl,
      })
      .eq("id", editing.id);
  
    if (error) {
      message.error(error.message);
      return;
    }
  
    message.success("Catégorie mise à jour !");
    setEditing(null);
    setFileList([]);
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

  async function uploadCategoryImage(file: File) {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
  
    const { error } = await supabase.storage
      .from("images-categories")
      .upload(fileName, file, { upsert: true });
  
    if (error) throw error;
  
    const { data } = supabase.storage
      .from("images-categories")
      .getPublicUrl(fileName);
  
    return data.publicUrl;
  }
  

  async function handleSubmit(values: CategoryFormValues) {
    if (editing) await update(values);
    else await add(values);
  }

  const orange = "#f97316";

  return (
    <Card
      title={
        <span style={{ fontWeight: 600, fontSize: "18px", color: orange }}>
          Catégories
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
      <Table
        rowKey="id"
        dataSource={categories}
        loading={loading}
        columns={[
          { title: "Nom", dataIndex: "name_fr" },          
          { title: "Ordre", dataIndex: "order" },
          { 
            title: "Remise", 
            dataIndex: "discount",
            render: d => d ? `${d}%` : "-"
          }, 
          {
            title: "Image",
            render: (_, record) =>
              record.image_url ? (
                <img
                  src={record.image_url}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              ) : (
                "-"
              ),
          },         
          {
            title: "Actions",
            render: (_, record) => (
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
                    setImageRemoved(false);
                    if (record.image_url) {
                      setFileList([
                        {
                          uid: "-1",
                          name: "image",
                          status: "done",
                          url: record.image_url,
                        },
                      ]);
                    } else {
                      setFileList([]);
                    }                    
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
            destroyOnHidden
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
                {editing ? "Modifier la catégorie" : "Ajouter une catégorie"}
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

                <Form.Item label="Image de la catégorie">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFileList(fileList);

                    // 👇 si l'utilisateur supprime l'image
                    if (fileList.length === 0) {
                      setImageRemoved(true);
                    }
                  }}
                  customRequest={({ onSuccess }) =>
                    setTimeout(() => onSuccess?.("ok"), 0)
                  }
                >
                    {fileList.length < 1 && (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Uploader</div>
                      </div>
                    )}
                  </Upload>
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
