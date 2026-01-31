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
import type { Product } from "@/types/ProductType";

interface ProductFormProps {
  categories: Category[];
  subcategories: SubCategory[];
  subsubcategories: SubSubCategory[];
  supabase: SupabaseClient;
  fetchAll: () => void;
  closeModal: () => void;
  editing?: Product | null;
}

interface CustomUploadFile extends UploadFile {
  dbId?: string;
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
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      const cat = editing.subcategory.category;
      const sub = editing.subcategory;
      const subsub = editing.subsubcategory;


      setSelectedCategory(cat.id);
      setSelectedSubcategory(sub.id);

      form.setFieldsValue({
        category_id: cat.id,
        subcategory_id: sub.id,
        subsub_id: subsub?.id ?? undefined,
      
        name_fr: editing.name_fr ?? undefined,
        name_nl: editing.name_nl ?? undefined,
        name_en: editing.name_en ?? undefined,
      
        description_fr: editing.description_fr ?? undefined,
        description_nl: editing.description_nl ?? undefined,
        description_en: editing.description_en ?? undefined,
      
        price: Number(editing.price),
        reference: editing.reference ?? undefined,
      });      
      

      if (editing.product_images?.length) {
        setFileList(
          editing.product_images.map((img) => ({
            uid: img.id,
            dbId: img.id,
            name: img.image_url.split("/").pop() || "image",
            status: "done",
            url: img.image_url,
          }))
        );
      }      
    } else {
      form.resetFields();
      setFileList([]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    }
  }, [editing, form, categories, subcategories, subsubcategories]);

  function sanitizeValues(values: ProductFormValues) {
    return {
      name_fr: values.name_fr,
      name_nl: values.name_nl,
      name_en: values.name_en,
      price: values.price,
      description_fr: values.description_fr ?? "",
      description_nl: values.description_nl ?? "",
      description_en: values.description_en ?? "",
      subcategory_id: values.subcategory_id ?? null,
      subsub_id: values.subsub_id ?? null,
      reference: values.reference
    };
  }

  async function handleSubmit(values: ProductFormValues) {
    setLoading(true);
    try {
      if (editing) {
        await updateProduct(values);
      } else {
        await addProduct(values);
      }
    } catch (err) {
      message.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(values: ProductFormValues) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const { data: prod, error } = await supabase
      .from("products")
      .insert([{ ...sanitizeValues(values), slug }])
      .select("id")
      .single();

    if (error || !prod) throw new Error(error?.message);

    await handleImageUpload(prod.id);
    message.success("Produit ajouté !");
    closeModal();
    fetchAll();
  }

  async function updateProduct(values: ProductFormValues) {
    if (!editing) return;

    const { error } = await supabase
      .from("products")
      .update(sanitizeValues(values))
      .eq("id", editing.id);

    if (error) throw new Error(error.message);

    await handleImageUpload(editing.id);
    message.success("Produit mis à jour !");
    closeModal();
    fetchAll();
  }

  async function handleImageUpload(productId: string) {
    const { data: oldImages } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId);

    if (!oldImages) return;

    const currentDbIds = fileList
      .map((f) => (f as CustomUploadFile).dbId)
      .filter(Boolean) as string[];

    const toDelete = oldImages.filter((img) => !currentDbIds.includes(img.id));

    for (const img of toDelete) {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", img.id);
  
      if (!error) {
        const fileName = img.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("images-products").remove([decodeURIComponent(fileName)]);
        }
      }
    }

    const newFiles = fileList.filter((f) => f.originFileObj);

    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map(async (file, i) => {
        const raw = file.originFileObj as File;
        const ext = raw.name.split(".").pop();
        const fileName = `${Date.now()}-${i}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("images-products")
          .upload(fileName, raw);

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("images-products")
          .getPublicUrl(fileName);

        return {
          product_id: productId,
          image_url: urlData.publicUrl,
          order: i,
        };
      });

      const results = await Promise.all(uploadPromises);
      await supabase.from("product_images").insert(results);
    }
  }

  const orange = "#f97316";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <Form.Item name="category_id" label="Catégorie" rules={[{ required: true }]}>
              <Select
                onChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubcategory(null);
                  form.setFieldsValue({ subcategory_id: undefined, subsub_id: undefined });
                }}
                options={categories.map((c) => ({ value: c.id, label: c.name_fr }))}
              />
            </Form.Item>

            <Form.Item name="subcategory_id" label="Sous-catégorie" rules={[{ required: true }]}>
              <Select
                disabled={!selectedCategory}
                onChange={(val) => {
                  setSelectedSubcategory(val);
                  form.setFieldValue("subsub_id", null);
                }}
                options={subcategories
                  .filter((s) => s.category_id === selectedCategory)
                  .map((s) => ({ value: s.id, label: s.name_fr }))}
              />
            </Form.Item>

            <Form.Item name="subsub_id" label="Sous-sous-catégorie">
              <Select
                allowClear
                disabled={!selectedSubcategory}
                options={subsubcategories
                  .filter((ss) => ss.subcategory_id === selectedSubcategory)
                  .map((ss) => ({ value: ss.id, label: ss.name_fr }))}
              />
            </Form.Item>

            <Form.Item name="price" label="Prix (€)" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div>
            <Form.Item name="name_fr" label="Nom (FR)" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="name_nl" label="Nom (NL)" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="name_en" label="Nom (EN)" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="reference" label="Référence" rules={[{ required: true }]}><Input /></Form.Item>
          </div>
        </div>

        <Form.Item name="description_fr" label="Description (FR)"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="description_nl" label="Description (NL)"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="description_en" label="Description (EN)"><Input.TextArea rows={2} /></Form.Item>

        <Form.Item label="Images">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onRemove={(file) => {
              const newFiles = fileList.filter((f) => f.uid !== file.uid);
              setFileList(newFiles);
            }}
            onChange={({ fileList: newFileList }) => {
              const updatedList = newFileList.map((file) => {
                const existing = fileList.find((f) => f.uid === file.uid);
                return {
                  ...file,
                  dbId: (file as CustomUploadFile).dbId || existing?.dbId,
                } as CustomUploadFile;
              });
              setFileList(updatedList);
            }}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 0)}
          >
            {fileList.length < 8 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Uploader</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          style={{ backgroundColor: orange, borderColor: orange, height: "48px" }}
        >
          {editing ? "Mettre à jour" : "Enregistrer"}
        </Button>
      </Form>
    </div>
  );
}

function slugify(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}