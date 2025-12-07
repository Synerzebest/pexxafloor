"use client";

import { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  message,
  Select,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { PlusOutlined } from "@ant-design/icons";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/CategoryType";
import type { SubCategory } from "@/types/SubCategoryType";
import type { SubSubCategory } from "@/types/SubSubCategoryType";
import type { ProductFormValues } from "@/types/ProductFormValues";
import type { ProductWithSubSub } from "@/types/ProductWithSubSubType";

interface ProductFormProps {
  categories: Category[];
  subcategories: SubCategory[];
  subsubcategories: SubSubCategory[];
  supabase: SupabaseClient;
  fetchAll: () => void;
  closeModal: () => void;
  editing?: ProductWithSubSub | null;
}

export default function ProductForm({
  categories,
  subcategories,
  subsubcategories,
  supabase,
  fetchAll,
  closeModal,
  editing = null,
}: ProductFormProps) {
  const [form] = Form.useForm<ProductFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  /* ------------------------------
   *  PRÉREMPLISSAGE DU FORMULAIRE
   * ------------------------------ */
  useEffect(() => {
    if (editing) {
      form.setFieldsValue(editing);

      const subsub = subsubcategories.find((ss) => ss.id === editing.subsub_id);
      const sub = subcategories.find((s) => s.id === subsub?.subcategory_id);
      const cat = categories.find((c) => c.id === sub?.category_id);

      if (cat) setSelectedCategory(cat.id);
      if (sub) setSelectedSubcategory(sub.id);

      form.setFieldsValue({
        category_id: cat?.id,
        subcategory_id: sub?.id,
        subsub_id: subsub?.id,
      });

      // Images existantes
      if (editing.product_images?.length) {
        const images: UploadFile[] = editing.product_images.map(
          (img, index) => ({
            uid: `img-${index}`,
            name: `image-${index}.jpg`,
            status: "done",
            url: img.image_url,
          })
        );
        setFileList(images);
      }
    } else {
      form.resetFields();
      setFileList([]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    }
  }, [editing, form, categories, subcategories, subsubcategories]);

  async function handleSubmit(values: ProductFormValues) {
    if (editing) await updateProduct(values);
    else await addProduct(values);
  }

  async function addProduct(values: ProductFormValues) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const payload = {
      ...values,
      slug,
    };

    const { data: prod, error } = await supabase
      .from("products")
      .insert([payload])
      .select("id")
      .single();

    if (error || !prod) {
      return message.error("Erreur lors de l’ajout : " + error?.message);
    }

    await handleImageUpload(prod.id);
    message.success("Produit ajouté !");
    closeModal();
    fetchAll();
  }

  async function updateProduct(values: ProductFormValues) {
    if (!editing) return;

    const { error } = await supabase
      .from("products")
      .update(values)
      .eq("id", editing.id);

    if (error) return message.error(error.message);

    await handleImageUpload(editing.id);
    message.success("Produit mis à jour !");
    closeModal();
    fetchAll();
  }

  async function handleImageUpload(productId: string) {
    const newImages = fileList.filter((f) => f.originFileObj);

    if (!newImages.length) return;

    const uploadPromises = newImages.map(async (file, i) => {
      const raw = file.originFileObj as File;
      const ext = raw.name.split(".").pop();
      const filePath = `${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, raw);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);

      return {
        product_id: productId,
        image_url: data.publicUrl,
        order: i,
      };
    });

    const savedImages = await Promise.all(uploadPromises);
    await supabase.from("product_images").insert(savedImages);
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      {/* --- CATÉGORIE --- */}
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
          onChange={(val) => {
            setSelectedCategory(val);
            setSelectedSubcategory(null);
            form.setFieldValue("subcategory_id", undefined);
            form.setFieldValue("subsub_id", undefined);
          }}
        />
      </Form.Item>

      {/* --- SOUS-CATÉGORIE --- */}
      <Form.Item
        name="subcategory_id"
        label="Sous-catégorie"
        rules={[{ required: true }]}
      >
        <Select
          disabled={!selectedCategory}
          placeholder="Choisir une sous-catégorie"
          options={subcategories
            .filter((s) => s.category_id === selectedCategory)
            .map((s) => ({
              value: s.id,
              label: s.name_fr,
            }))}
          onChange={(val) => {
            setSelectedSubcategory(val);
            form.setFieldValue("subsub_id", undefined);
          }}
        />
      </Form.Item>

      {/* --- SOUS-SOUS-CATÉGORIE --- */}
      <Form.Item
        name="subsub_id"
        label="Sous-sous-catégorie"
        rules={[{ required: true }]}
      >
        <Select
          disabled={!selectedSubcategory}
          options={subsubcategories
            .filter((ss) => ss.subcategory_id === selectedSubcategory)
            .map((ss) => ({
              value: ss.id,
              label: ss.name_fr,
            }))}
        />
      </Form.Item>

      {/* --- INFOS PRODUIT --- */}
      <Form.Item name="name_fr" label="Nom (FR)" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="name_nl" label="Nom (NL)" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="name_en" label="Nom (EN)" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="price" label="Prix (€)" rules={[{ required: true }]}>
        <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="description_fr" label="Description (FR)">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="description_nl" label="Description (NL)">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="description_en" label="Description (EN)">
        <Input.TextArea rows={2} />
      </Form.Item>

      {/* --- IMAGE UPLOAD --- */}
      <Form.Item label="Images">
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          customRequest={({ onSuccess }) =>
            setTimeout(() => onSuccess?.("ok"), 0)
          }
        >
          <div>
            <PlusOutlined />
            <div>Upload</div>
          </div>
        </Upload>
      </Form.Item>

      <Button type="primary" htmlType="submit" block>
        {editing ? "Mettre à jour" : "Enregistrer"}
      </Button>
    </Form>
  );
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
