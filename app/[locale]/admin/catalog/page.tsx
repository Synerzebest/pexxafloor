"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Card,
  Upload,
} from "antd";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Navbar, Footer } from "@/components";
import { PlusOutlined } from "@ant-design/icons";

function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")              
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")    
    .replace(/^-+|-+$/g, ""); 
}


export default function AdminPage() {
  const supabase = createClientComponentClient();

  // States
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subsubcategories, setSubsubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Modals
  const [openCat, setOpenCat] = useState(false);
  const [openSub, setOpenSub] = useState(false);
  const [openSubSub, setOpenSubSub] = useState(false);
  const [formSubSub] = Form.useForm();
  const [openProd, setOpenProd] = useState(false);

  const [formCat] = Form.useForm();
  const [formSub] = Form.useForm();
  const [formProd] = Form.useForm();

  // ========== FETCH ==========
  async function fetchAll() {
    setLoading(true);

    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("order");

    const { data: subs } = await supabase
      .from("subcategories")
      .select("*")
      .order("order");
    
    const { data: subsubs } = await supabase
      .from("subsubcategories")
      .select("*")
      .order("order");
    
    setSubsubcategories(subsubs || []);
    

    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (prods) {
      const prodsWithImages = await Promise.all(
        prods.map(async (p) => {
          const { data: imgs } = await supabase
            .from("product_images")
            .select("id, image_url, order")
            .eq("product_id", p.id)
            .order("order");
    
          return { ...p, product_images: imgs || [] };
        })
      );
    
      setProducts(prodsWithImages);
    }
    

    setCategories(cats || []);
    setSubcategories(subs || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // ========== HANDLERS ==========
  async function addCategory(values: any) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let count = 1;
  
    // Vérifier l'unicité dans la table
    while (true) {
      const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
  
      if (!data) break; // slug libre
      slug = `${baseSlug}-${count++}`;
    }
  
    const { error } = await supabase
      .from("categories")
      .insert([{ ...values, slug }]);
  
    if (error) return message.error(error.message);
    message.success("Catégorie ajoutée !");
    setOpenCat(false);
    formCat.resetFields();
    fetchAll();
  }
  

  async function addSubcategory(values: any) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const { data } = await supabase
        .from("subcategories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
  
      if (!data) break; // slug libre
      slug = `${baseSlug}-${count++}`;
    }
    const { error } = await supabase
      .from("subcategories")
      .insert([{ ...values, slug}]);

    if (error) return message.error(error.message);
    message.success("Sous-catégorie ajoutée !");
    setOpenSub(false);
    formSub.resetFields();
    fetchAll();
  }

  async function addSubSubcategory(values: any) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let count = 1;
  
    while (true) {
      const { data } = await supabase
        .from("subsubcategories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${count++}`;
    }
  
    const { error } = await supabase
      .from("subsubcategories")
      .insert([{ ...values, slug }]);
  
    if (error) return message.error(error.message);
    message.success("Sous-sous-catégorie ajoutée !");
    setOpenSubSub(false);
    formSubSub.resetFields();
    fetchAll();
  }
  

  async function addProduct(values: any) {
    const baseSlug = slugify(values.name_fr);
    let slug = baseSlug;
    let count = 1;
  
    // Vérifier l'unicité dans la table "products"
    while (true) {
      const { data } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
  
      if (!data) break; // slug libre
      slug = `${baseSlug}-${count++}`;
    }
  
    const { images, ...productData } = values;
  
    // Création du produit avec slug
    const { data: prod, error } = await supabase
      .from("products")
      .insert([{ ...productData, slug }])
      .select("id")
      .single();
  
    if (error || !prod) {
      console.error("Erreur insertion produit:", error);
      return message.error(error?.message || "Impossible d’ajouter le produit.");
    }
  
    // Vérification fileList
    if (!fileList.length) {
      message.warning("Produit créé sans images.");
      return fetchAll();
    }
  
    // Construction des rows pour product_images
    const rows = fileList.map((file, i) => ({
      product_id: prod.id,
      image_url: file.url || file.response?.url || "",
      order: i,
    }));
  
    // Insertion des images
    const { error: imgError } = await supabase
      .from("product_images")
      .insert(rows);
  
    if (imgError) {
      console.error("Insertion product_images échouée:", imgError);
      return message.error(imgError.message);
    }
  
    message.success("Produit + images ajoutés !");
    setOpenProd(false);
    formProd.resetFields();
    setFileList([]);
    fetchAll();
  }  
  

  // ========== TABLES ==========
  const catCols = [
    { title: "Slug", dataIndex: "slug" },
    { title: "FR", dataIndex: "name_fr" },
    { title: "NL", dataIndex: "name_nl" },
    { title: "EN", dataIndex: "name_en" },
    { title: "Ordre", dataIndex: "order" },
  ];

  const subCols = [
    { title: "Slug", dataIndex: "slug" },
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
  ];

  const prodCols = [
    {
      title: "Image",
      dataIndex: "product_images",
      render: (imgs: any[]) =>
        imgs?.length ? (
          <img
            src={imgs[0].image_url}
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
    { title: "Slug", dataIndex: "slug" },
    {
      title: "Sous-sous-catégorie",
      dataIndex: "subsub_id",
      render: (id: string) => {
        const subsub = subsubcategories.find((s) => s.id === id);
        if (!subsub) return id;
        const parent = subcategories.find((s) => s.id === subsub.subcategory_id);
        return parent
          ? `${parent.name_fr} > ${subsub.name_fr}`
          : subsub.name_fr;
      },
    },    
    { title: "FR", dataIndex: "name_fr" },
    { title: "Prix", dataIndex: "price" },
  ];

  return (
    <>
      <Navbar />

      <div className="p-6 space-y-10 flex flex-col gap-4">
        <h1 className="text-3xl font-bold mb-8">Panneau d’administration</h1>

        {/* --- CATEGORIES --- */}
        <Card
          title="Catégories"
          extra={<Button onClick={() => setOpenCat(true)}>+ Ajouter</Button>}
        >
          <Table
            rowKey="id"
            dataSource={categories}
            columns={catCols}
            loading={loading}
          />
        </Card>

        <Modal
          open={openCat}
          onCancel={() => setOpenCat(false)}
          footer={null}
          title="Ajouter une catégorie"
        >
          <Form form={formCat} layout="vertical" onFinish={addCategory}>
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
              <InputNumber />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal>

        {/* --- SOUS-CATEGORIES --- */}
        <Card
          title="Sous-catégories"
          extra={<Button onClick={() => setOpenSub(true)}>+ Ajouter</Button>}
        >
          <Table
            rowKey="id"
            dataSource={subcategories}
            columns={subCols}
            loading={loading}
          />
        </Card>

        <Modal
          open={openSub}
          onCancel={() => setOpenSub(false)}
          footer={null}
          title="Ajouter une sous-catégorie"
        >
          <Form form={formSub} layout="vertical" onFinish={addSubcategory}>
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
              <InputNumber />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal>

        {/* --- SOUS-SOUS-CATEGORIES --- */}
        <Card
          title="Sous-sous-catégories"
          extra={<Button onClick={() => setOpenSubSub(true)}>+ Ajouter</Button>}
        >
          <Table
            rowKey="id"
            dataSource={subsubcategories}
            columns={[
              { title: "Slug", dataIndex: "slug" },
              {
                title: "Sous-catégorie",
                dataIndex: "subcategory_id",
                render: (id: string) => {
                  const sub = subcategories.find((s) => s.id === id);
                  return sub ? sub.name_fr : id;
                },
              },
              { title: "FR", dataIndex: "name_fr" },
              { title: "NL", dataIndex: "name_nl" },
              { title: "EN", dataIndex: "name_en" },
            ]}
            loading={loading}
          />
        </Card>

        <Modal
          open={openSubSub}
          onCancel={() => setOpenSubSub(false)}
          footer={null}
          title="Ajouter une sous-sous-catégorie"
        >
          <Form form={formSubSub} layout="vertical" onFinish={addSubSubcategory}>
            <Form.Item
              name="subcategory_id"
              label="Sous-catégorie"
              rules={[{ required: true }]}
            >
              <Select
                options={subcategories.map((s) => ({
                  value: s.id,
                  label: s.name_fr,
                }))}
              />
            </Form.Item>
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
              <InputNumber />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal>

        {/* --- PRODUITS --- */}
        <Card
          title="Produits"
          extra={<Button onClick={() => setOpenProd(true)}>+ Ajouter</Button>}
        >
          <Table
            rowKey="id"
            dataSource={products}
            columns={prodCols}
            loading={loading}
          />
        </Card>

        <Modal
          open={openProd}
          onCancel={() => setOpenProd(false)}
          footer={null}
          title="Ajouter un produit"
        >
          <Form form={formProd} layout="vertical" onFinish={addProduct}>
            <Form.Item
              name="subsub_id"
              label="Sous-sous-catégorie"
              rules={[{ required: true }]}
            >
              <Select
                options={subsubcategories.map((ss) => {
                  const parent = subcategories.find((s) => s.id === ss.subcategory_id);
                  return {
                    value: ss.id,
                    label: `${parent ? parent.name_fr + " > " : ""}${ss.name_fr}`,
                  };
                })}
              />
            </Form.Item>
            <Form.Item name="name_fr" label="Nom (FR)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="name_nl" label="Nom (NL)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="name_en" label="Nom (EN)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Prix"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.01} />
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
            <Form.Item label="Images">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    const ext = (file as File).name.split(".").pop();
                    const filePath = `${Date.now()}-${Math.random()}.${ext}`;

                    const { error } = await supabase.storage
                      .from("products")
                      .upload(filePath, file as File);

                    if (error) throw error;

                    await setTimeout(() => 300)
                    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
                    const publicUrl = data.publicUrl;

                    setFileList((prev) =>
                      prev.map((f) =>
                        f.uid === (file as any).uid
                          ? { ...f, url: publicUrl, status: "done" }
                          : f
                      )
                    );

                    onSuccess?.({ url: publicUrl }, file as any);
                  } catch (err) {
                    onError?.(err as Error);
                  }
                }}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal>
      </div>

      <Footer />
    </>
  );
}
