"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/ProductType";
import type { PackDefinition, PackQuantityMode, PackRole } from "@/types/PackConfigType";

const orange = "#f97316";

type PackFormValues = {
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  image_url?: string | null;
  installation_ease?: number | null;
  installation_speed?: number | null;
  price_level?: number | null;
  installation_height_fr?: string | null;
  installation_height_nl?: string | null;
  installation_height_en?: string | null;
  insulation_fr?: string | null;
  insulation_nl?: string | null;
  insulation_en?: string | null;
  sort_order?: number;
  active?: boolean;
};

type PackItemFormValues = {
  product_id: string;
  role: PackRole;
  group_key?: string;
  quantity_mode: PackQuantityMode;
  quantity_value?: number;
  multiplier?: number;
  rounding?: string;
  conditions?: string;
  condition_tuyau_type?: string[];
  condition_type_agrafe?: number[];
  condition_type_isolation?: number[];
  condition_pas_de_pose?: number[];
  condition_treillis_type?: string[];
  sort_order?: number;
  active?: boolean;
};

type ProductOption = {
  value: string;
  label: string;
  searchText: string;
  imageUrl?: string;
  reference?: string | null;
  price: number;
};

const roleOptions = [
  {
    value: "calculated",
    label: "Produit calculé",
    description: "Ajouté automatiquement selon la surface, les circuits ou les choix du client.",
    icon: <CalculatorOutlined />,
  },
  {
    value: "included",
    label: "Inclus / offert",
    description: "Toujours ajouté au pack, par exemple un accessoire offert.",
    icon: <GiftOutlined />,
  },
  {
    value: "option",
    label: "Option client",
    description: "Proposé au client comme option qu'il peut cocher.",
    icon: <ShoppingOutlined />,
  },
];

const quantityModeOptions = [
  {
    value: "fixed",
    label: "Quantité fixe",
    help: "Ex: toujours 1 pièce dans le pack.",
  },
  {
    value: "per_surface",
    label: "Selon la surface",
    help: "Ex: panneaux, treillis ou isolant. Quantité = surface / valeur.",
  },
  {
    value: "per_tube_length",
    label: "Selon la longueur de tuyau",
    help: "Ex: clips ou accessoires par mètres de tuyau.",
  },
  {
    value: "per_circuit",
    label: "Selon le nombre de circuits",
    help: "Ex: raccords, têtes, sorties collecteur.",
  },
  {
    value: "per_perimeter",
    label: "Selon le périmètre estimé",
    help: "Ex: bande périphérique.",
  },
  {
    value: "capacity_match",
    label: "Choisir la bonne capacité",
    help: "Ex: collecteur 4, 5, 6 circuits. Mettre les produits dans le même groupe.",
  },
  {
    value: "roll_optimizer",
    label: "Optimiser les rouleaux",
    help: "Ex: choisir les rouleaux de tuyau pour couvrir la longueur calculée.",
  },
  {
    value: "manual_option",
    label: "Option manuelle",
    help: "Pour les options simples sélectionnées par le client.",
  },
];

const roleLabelMap = Object.fromEntries(roleOptions.map((option) => [option.value, option.label]));
const quantityModeLabelMap = Object.fromEntries(
  quantityModeOptions.map((option) => [option.value, option.label])
);

function normalizeArray(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
}

function conditionsToFields(conditions: Record<string, unknown>) {
  return {
    condition_tuyau_type: normalizeArray(conditions.tuyauType) as string[] | undefined,
    condition_type_agrafe: normalizeArray(conditions.typeAgrafe) as number[] | undefined,
    condition_type_isolation: normalizeArray(conditions.typeIsolation) as number[] | undefined,
    condition_pas_de_pose: normalizeArray(conditions.pasDePose) as number[] | undefined,
    condition_treillis_type: normalizeArray(conditions.treillisType) as string[] | undefined,
  };
}

function compactConditions(values: PackItemFormValues) {
  const conditions: Record<string, unknown> = {};

  if (values.condition_tuyau_type?.length) conditions.tuyauType = values.condition_tuyau_type;
  if (values.condition_type_agrafe?.length) conditions.typeAgrafe = values.condition_type_agrafe;
  if (values.condition_type_isolation?.length) conditions.typeIsolation = values.condition_type_isolation;
  if (values.condition_pas_de_pose?.length) conditions.pasDePose = values.condition_pas_de_pose;
  if (values.condition_treillis_type?.length) conditions.treillisType = values.condition_treillis_type;

  return conditions;
}

export default function PackSection({
  products,
  supabase,
}: {
  products: Product[];
  supabase: SupabaseClient;
}) {
  const [packs, setPacks] = useState<PackDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<PackDefinition | null>(null);
  const [selectedPack, setSelectedPack] = useState<PackDefinition | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [expandedPackIds, setExpandedPackIds] = useState<React.Key[]>([]);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [packImageFiles, setPackImageFiles] = useState<UploadFile[]>([]);
  const [savingPack, setSavingPack] = useState(false);
  const [packForm] = Form.useForm<PackFormValues>();
  const [itemForm] = Form.useForm<PackItemFormValues>();
  const selectedRole = Form.useWatch("role", itemForm);
  const selectedMode = Form.useWatch("quantity_mode", itemForm);
  const selectedProductId = Form.useWatch("product_id", itemForm);

  const productOptions = useMemo(
    () =>
      products.map((product): ProductOption => ({
        value: product.id,
        label: product.name_fr,
        searchText: [
          product.name_fr,
          product.name_nl,
          product.name_en,
          product.reference,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        imageUrl: product.product_images?.[0]?.image_url,
        reference: product.reference,
        price: Number(product.price || 0),
      })),
    [products]
  );

  const selectedProduct = productOptions.find((product) => product.value === selectedProductId);
  const selectedModeHelp = quantityModeOptions.find((option) => option.value === selectedMode)?.help;

  async function fetchPacks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("packs")
      .select(`
        id,
        slug,
        name_fr,
        name_nl,
        name_en,
        image_url,
        installation_ease,
        installation_speed,
        price_level,
        installation_height_fr,
        installation_height_nl,
        installation_height_en,
        insulation_fr,
        insulation_nl,
        insulation_en,
        active,
        sort_order,
        pack_items (
          id,
          pack_id,
          product_id,
          role,
          group_key,
          quantity_mode,
          quantity_value,
          multiplier,
          rounding,
          conditions,
          sort_order,
          active,
          product:products (
            id,
            name_fr,
            price,
            reference,
            product_images!fk_product (
              id,
              image_url,
              order
            )
          )
        )
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      message.error("Erreur chargement packs : " + error.message);
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((pack: any) => ({
      ...pack,
      pack_items: [...(pack.pack_items || [])].sort(
        (a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
      ),
    }));

    setPacks(normalized);
    setEditingPack((current) =>
      current ? normalized.find((pack: PackDefinition) => pack.id === current.id) || current : current
    );
    setSelectedPack((current) =>
      current ? normalized.find((pack: PackDefinition) => pack.id === current.id) || current : current
    );
    setLoading(false);
  }

  useEffect(() => {
    fetchPacks();
  }, []);

  function openPackModal(pack?: PackDefinition) {
    setEditingPack(pack || null);
    setPackModalOpen(true);
    setPackImageFiles(
      pack?.image_url
        ? [{
            uid: `pack-${pack.id}`,
            name: pack.image_url.split("/").pop() || "image-pack",
            status: "done",
            url: pack.image_url,
          }]
        : []
    );
    packForm.setFieldsValue(
      pack
        ? pack
        : {
            active: true,
            installation_ease: 50,
            installation_speed: 50,
            price_level: 50,
            sort_order: packs.length + 1,
          }
    );
  }

  async function savePack(values: PackFormValues) {
    setSavingPack(true);
    let uploadedPath: string | null = null;

    try {
      const newImage = packImageFiles.find((file) => file.originFileObj)?.originFileObj as File | undefined;
      let imageUrl = packImageFiles[0]?.url || null;

      if (newImage) {
        const extension = newImage.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeSlug = values.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        uploadedPath = `packs/${safeSlug}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("images-products")
          .upload(uploadedPath, newImage, {
            cacheControl: "3600",
            contentType: newImage.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        imageUrl = supabase.storage
          .from("images-products")
          .getPublicUrl(uploadedPath).data.publicUrl;
      }

      const payload = {
        slug: values.slug.trim(),
        name_fr: values.name_fr.trim(),
        name_nl: values.name_nl.trim(),
        name_en: values.name_en.trim(),
        image_url: imageUrl,
        installation_ease: values.installation_ease ?? 50,
        installation_speed: values.installation_speed ?? 50,
        price_level: values.price_level ?? 50,
        installation_height_fr: values.installation_height_fr?.trim() || null,
        installation_height_nl: values.installation_height_nl?.trim() || null,
        installation_height_en: values.installation_height_en?.trim() || null,
        insulation_fr: values.insulation_fr?.trim() || null,
        insulation_nl: values.insulation_nl?.trim() || null,
        insulation_en: values.insulation_en?.trim() || null,
        sort_order: values.sort_order || 0,
        active: values.active ?? true,
      };

      const result = editingPack
        ? await supabase.from("packs").update(payload).eq("id", editingPack.id)
        : await supabase.from("packs").insert(payload);
      if (result.error) throw result.error;

      const previousUrl = editingPack?.image_url;
      if (previousUrl && previousUrl !== imageUrl) {
        const marker = "/storage/v1/object/public/images-products/";
        const path = previousUrl.includes(marker)
          ? decodeURIComponent(previousUrl.split(marker)[1] || "")
          : "";
        if (path.startsWith("packs/")) {
          await supabase.storage.from("images-products").remove([path]);
        }
      }

      message.success(editingPack ? "Pack modifié" : "Pack ajouté");
      setPackModalOpen(false);
      setPackImageFiles([]);
      packForm.resetFields();
      await fetchPacks();
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from("images-products").remove([uploadedPath]);
      }
      message.error(
        "Erreur sauvegarde pack : " +
          (error instanceof Error ? error.message : "échec de l’enregistrement")
      );
    } finally {
      setSavingPack(false);
    }
  }

  function openItemModal(pack: PackDefinition, item?: any) {
    setSelectedPack(pack);
    setEditingItem(item || null);
    setItemModalOpen(true);
    itemForm.resetFields();

    const conditions = item?.conditions || {};

    itemForm.setFieldsValue(
      item
        ? {
            ...item,
            ...conditionsToFields(conditions),
            conditions: JSON.stringify(conditions, null, 2),
          }
        : {
            role: "calculated",
            quantity_mode: "fixed",
            quantity_value: 1,
            multiplier: 1,
            rounding: "ceil",
            conditions: "{}",
            sort_order: pack.pack_items.length + 1,
            active: true,
          }
    );
  }

  async function saveItem(values: PackItemFormValues) {
    if (!selectedPack) return;

    let conditions: Record<string, unknown> = {};

    try {
      conditions = {
        ...(values.conditions ? JSON.parse(values.conditions) : {}),
        ...compactConditions(values),
      };
    } catch {
      message.error("Conditions JSON invalides");
      return;
    }

    const payload = {
      pack_id: selectedPack.id,
      product_id: values.product_id,
      role: values.role,
      group_key: values.group_key || null,
      quantity_mode: values.quantity_mode,
      quantity_value: values.quantity_value ?? null,
      multiplier: values.multiplier ?? 1,
      rounding: values.rounding || "ceil",
      conditions,
      sort_order: values.sort_order || 0,
      active: values.active ?? true,
    };

    const res = await fetch(
      editingItem ? `/api/admin/pack-items/${editingItem.id}` : "/api/admin/pack-items",
      {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      message.error("Erreur sauvegarde ligne : " + (data?.error || res.statusText));
      return;
    }

    message.success(editingItem ? "Ligne modifiée" : "Ligne ajoutée");
    setItemModalOpen(false);
    itemForm.resetFields();
    await fetchPacks();
  }

  async function deletePack(pack: PackDefinition) {
    const { error } = await supabase.from("packs").delete().eq("id", pack.id);
    if (error) {
      message.error("Erreur suppression pack : " + error.message);
      return;
    }
    message.success("Pack supprimé");
    await fetchPacks();
  }

  async function deleteItem(item: any) {
    setDeletingItemId(item.id);

    try {
      const res = await fetch(`/api/admin/pack-items/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        message.error("Erreur suppression ligne : " + (data?.error || res.statusText));
        return;
      }

      message.success("Ligne supprimée");
      setPacks((prev) =>
        prev.map((pack) => ({
          ...pack,
          pack_items: pack.pack_items.filter((packItem) => packItem.id !== item.id),
        }))
      );
      setEditingPack((prev) =>
        prev
          ? {
              ...prev,
              pack_items: prev.pack_items.filter((packItem) => packItem.id !== item.id),
            }
          : prev
      );
      setSelectedPack((prev) =>
        prev
          ? {
              ...prev,
              pack_items: prev.pack_items.filter((packItem) => packItem.id !== item.id),
            }
          : prev
      );
      await fetchPacks();
    } finally {
      setDeletingItemId(null);
    }
  }

  function togglePackLines(pack: PackDefinition) {
    setExpandedPackIds((prev) =>
      prev.includes(pack.id)
        ? prev.filter((id) => id !== pack.id)
        : [...prev, pack.id]
    );
  }

  function openLineFromPackModal(pack: PackDefinition, item?: any) {
    setPackModalOpen(false);
    openItemModal(pack, item);
  }

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 18, color: orange }}>Packs</span>}
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={() => openPackModal()}
          style={{ background: orange, borderColor: orange, color: "white", borderRadius: 8 }}
        >
          Ajouter
        </Button>
      }
      style={{ borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
    >
      <Table
        rowKey="id"
        dataSource={packs}
        loading={loading}
        pagination={false}
        expandable={{
          expandedRowKeys: expandedPackIds,
          onExpandedRowsChange: (keys) => setExpandedPackIds([...keys]),
          expandedRowRender: (pack) => (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    Produits configurés dans {pack.name_fr}
                  </div>
                  <div className="text-sm text-gray-600">
                    Utilisez les boutons Modifier ou Supprimer sur chaque ligne ci-dessous.
                  </div>
                </div>
                <Button icon={<PlusOutlined />} onClick={() => openItemModal(pack)} className="w-fit">
                  Ajouter un produit au pack
                </Button>
              </div>
              <Table
                rowKey="id"
                dataSource={pack.pack_items}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Produit",
                    render: (_: unknown, item: any) => {
                      const imageUrl = item.product?.product_images?.[0]?.image_url;

                      return (
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <img
                            src={imageUrl || "/images/box.png"}
                            alt={item.product?.name_fr || "Produit"}
                            className="h-10 w-10 rounded-md border border-gray-200 object-cover bg-white"
                          />
                          <div className="leading-tight">
                            <div className="font-medium text-gray-800">
                              {item.product?.name_fr || "Produit supprimé"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product?.reference || "Sans référence"}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    title: "Rôle",
                    dataIndex: "role",
                    render: (role) => <Tag>{roleLabelMap[role] || role}</Tag>,
                  },
                  { title: "Groupe", dataIndex: "group_key" },
                  {
                    title: "Formule",
                    dataIndex: "quantity_mode",
                    render: (mode) => quantityModeLabelMap[mode] || mode,
                  },
                  { title: "Valeur", dataIndex: "quantity_value" },
                  { title: "Multiplicateur", dataIndex: "multiplier" },
                  {
                    title: "Conditions",
                    render: (_: unknown, item: any) => JSON.stringify(item.conditions || {}),
                  },
                  {
                    title: "Actif",
                    render: (_: unknown, item: any) => (item.active ? "Oui" : "Non"),
                  },
                  {
                    title: "Actions",
                    render: (_: unknown, item: any) => (
                      <Space>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openItemModal(pack, item)}>
                          Modifier
                        </Button>
                        <Popconfirm
                          title="Supprimer cette ligne ?"
                          description={
                            item.product?.name_fr
                              ? `Retirer "${item.product.name_fr}" de ce pack.`
                              : "Retirer cette ligne du pack."
                          }
                          okText="Supprimer"
                          cancelText="Annuler"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => deleteItem(item)}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingItemId === item.id}
                          >
                            Supprimer
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          ),
        }}
        columns={[
          { title: "Ordre", dataIndex: "sort_order", width: 90 },
          { title: "Slug", dataIndex: "slug" },
          { title: "Nom", dataIndex: "name_fr" },
          {
            title: "Statut",
            render: (_: unknown, pack: PackDefinition) =>
              pack.active ? <Tag color="green">Actif</Tag> : <Tag>Inactif</Tag>,
          },
          {
            title: "Lignes",
            render: (_: unknown, pack: PackDefinition) => (
              <Button size="small" onClick={() => togglePackLines(pack)}>
                {expandedPackIds.includes(pack.id) ? "Masquer" : "Voir / modifier"} ({pack.pack_items?.length || 0})
              </Button>
            ),
          },
          {
            title: "Actions",
            render: (_: unknown, pack: PackDefinition) => (
              <Space>
                <Button icon={<PlusOutlined />} size="small" onClick={() => openItemModal(pack)}>
                  Ajouter ligne
                </Button>
                <Button icon={<EditOutlined />} size="small" onClick={() => openPackModal(pack)}>
                  Modifier pack
                </Button>
                <Button danger icon={<DeleteOutlined />} size="small" onClick={() => deletePack(pack)}>
                  Supprimer pack
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={packModalOpen}
        onCancel={() => {
          if (savingPack) return;
          setPackModalOpen(false);
          setPackImageFiles([]);
        }}
        footer={null}
        title={editingPack ? "Modifier le pack" : "Ajouter un pack"}
        centered
        width={editingPack ? 920 : 520}
      >
        <Form form={packForm} layout="vertical" onFinish={savePack}>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input placeholder="treillis" />
          </Form.Item>
          <Form.Item name="name_fr" label="Nom FR" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name_nl" label="Nom NL" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name_en" label="Nom EN" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Image principale du pack"
            extra="JPG, PNG, WebP ou AVIF — maximum 5 Mo. La nouvelle image remplacera l’ancienne."
          >
            <Upload
              accept="image/jpeg,image/png,image/webp,image/avif"
              listType="picture-card"
              fileList={packImageFiles}
              maxCount={1}
              beforeUpload={(file) => {
                const accepted = ["image/jpeg", "image/png", "image/webp", "image/avif"];
                if (!accepted.includes(file.type)) {
                  message.error("Format non accepté. Utilisez JPG, PNG, WebP ou AVIF.");
                  return Upload.LIST_IGNORE;
                }
                if (file.size > 5 * 1024 * 1024) {
                  message.error("L’image ne peut pas dépasser 5 Mo.");
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              onChange={({ fileList }) => setPackImageFiles(fileList.slice(-1))}
              onRemove={() => {
                setPackImageFiles([]);
                return true;
              }}
            >
              {packImageFiles.length === 0 && (
                <div className="flex flex-col items-center gap-1">
                  <PlusOutlined />
                  <span className="text-xs">Choisir une image</span>
                </div>
              )}
            </Upload>
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Form.Item name="installation_ease" label="Facilité de pose">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
            <Form.Item name="installation_speed" label="Vitesse de pose">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
            <Form.Item name="price_level" label="Niveau prix">
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Form.Item name="installation_height_fr" label="Hauteur FR">
              <Input placeholder="22mm" />
            </Form.Item>
            <Form.Item name="installation_height_nl" label="Hauteur NL">
              <Input />
            </Form.Item>
            <Form.Item name="installation_height_en" label="Hauteur EN">
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Form.Item name="insulation_fr" label="Isolation FR">
              <Input />
            </Form.Item>
            <Form.Item name="insulation_nl" label="Isolation NL">
              <Input />
            </Form.Item>
            <Form.Item name="insulation_en" label="Isolation EN">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="sort_order" label="Ordre">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="active" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={savingPack} style={{ background: orange }}>
            Sauvegarder les paramètres
          </Button>
        </Form>

        {editingPack && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Lignes du pack
                </h3>
                <p className="text-sm text-gray-500">
                  Produits, formules de quantité, options et conditions de ce pack.
                </p>
              </div>
              <Button icon={<PlusOutlined />} onClick={() => openLineFromPackModal(editingPack)}>
                Ajouter une ligne
              </Button>
            </div>

            <Table
              rowKey="id"
              dataSource={editingPack.pack_items}
              pagination={false}
              size="small"
              locale={{ emptyText: "Aucune ligne dans ce pack" }}
              columns={[
                {
                  title: "Produit",
                  render: (_: unknown, item: any) => {
                    const imageUrl = item.product?.product_images?.[0]?.image_url;

                    return (
                      <div className="flex min-w-[220px] items-center gap-3">
                        <img
                          src={imageUrl || "/images/box.png"}
                          alt={item.product?.name_fr || "Produit"}
                          className="h-10 w-10 rounded-md border border-gray-200 bg-white object-cover"
                        />
                        <div className="leading-tight">
                          <div className="font-medium text-gray-800">
                            {item.product?.name_fr || "Produit supprimé"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.product?.reference || "Sans référence"}
                          </div>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: "Rôle",
                  dataIndex: "role",
                  render: (role) => <Tag>{roleLabelMap[role] || role}</Tag>,
                },
                {
                  title: "Formule",
                  dataIndex: "quantity_mode",
                  render: (mode) => quantityModeLabelMap[mode] || mode,
                },
                {
                  title: "Actions",
                  render: (_: unknown, item: any) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openLineFromPackModal(editingPack, item)}
                      >
                        Modifier
                      </Button>
                      <Popconfirm
                        title="Supprimer cette ligne ?"
                        description={
                          item.product?.name_fr
                            ? `Retirer "${item.product.name_fr}" de ce pack.`
                            : "Retirer cette ligne du pack."
                        }
                        okText="Supprimer"
                        cancelText="Annuler"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteItem(item)}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletingItemId === item.id}
                        >
                          Supprimer
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        footer={null}
        title={editingItem ? "Modifier une ligne de pack" : "Ajouter une ligne de pack"}
        centered
        width={980}
      >
        <Form form={itemForm} layout="vertical" onFinish={saveItem}>
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">1. Produit du catalogue</h3>
                  <p className="text-sm text-gray-500">
                    Choisissez le produit réel qui sera utilisé dans le pack.
                  </p>
                </div>
                {selectedProduct && (
                  <div className="hidden items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
                    <img
                      src={selectedProduct.imageUrl || "/images/box.png"}
                      alt={selectedProduct.label}
                      className="h-12 w-12 rounded-md border border-gray-200 object-cover bg-white"
                    />
                    <div className="leading-tight">
                      <div className="max-w-[260px] truncate text-sm font-medium text-gray-800">
                        {selectedProduct.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedProduct.reference || "Sans référence"} · {selectedProduct.price.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Form.Item name="product_id" label="Produit catalogue" rules={[{ required: true }]}>
                <Select
                  showSearch
                  size="large"
                  placeholder="Rechercher par nom ou référence"
                  options={productOptions}
                  optionLabelProp="label"
                  filterOption={(input, option) =>
                    String((option as ProductOption | undefined)?.searchText || "")
                      .includes(input.toLowerCase())
                  }
                  optionRender={(option) => {
                    const data = option.data as ProductOption;

                    return (
                      <div className="flex items-center gap-3 py-1">
                        <img
                          src={data.imageUrl || "/images/box.png"}
                          alt={data.label}
                          className="h-11 w-11 rounded-md border border-gray-200 object-cover bg-white"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-800">
                            {data.label}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{data.reference || "Sans référence"}</span>
                            <span>{data.price.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </Form.Item>
            </section>

            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">2. Rôle dans le pack</h3>
              <p className="mb-4 text-sm text-gray-500">
                Dites simplement comment ce produit doit apparaître pour le client.
              </p>

              <Form.Item name="role" rules={[{ required: true }]}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {roleOptions.map((option) => {
                    const active = selectedRole === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          itemForm.setFieldValue("role", option.value);
                          if (option.value === "option") {
                            itemForm.setFieldValue("quantity_mode", "manual_option");
                            itemForm.setFieldValue("quantity_value", 1);
                          }
                        }}
                        className={`min-h-[112px] rounded-lg border p-4 text-left transition ${
                          active
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className={active ? "text-orange-600" : "text-gray-500"}>
                            {option.icon}
                          </span>
                          {option.label}
                        </div>
                        <p className="text-xs leading-5 text-gray-500">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Form.Item>
            </section>

            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">3. Calcul de quantité</h3>
              <p className="mb-4 text-sm text-gray-500">
                Choisissez la règle métier. Les champs utiles restent simples : capacité, multiplicateur et groupe.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item name="quantity_mode" label="Méthode de calcul" rules={[{ required: true }]}>
                  <Select
                    size="large"
                    options={quantityModeOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="group_key"
                  label="Famille de choix"
                  tooltip="Utilisé pour regrouper des alternatives, par exemple tous les collecteurs ou tous les rouleaux de tuyau."
                >
                  <Input size="large" placeholder="collecteur, tubes-pert, treillis..." />
                </Form.Item>

                <Form.Item
                  name="quantity_value"
                  label="Valeur ou capacité"
                  tooltip="Exemples : 100 m par rouleau, 10 m² par panneau, 6 circuits pour un collecteur."
                >
                  <InputNumber min={0} size="large" className="w-full" />
                </Form.Item>

                <Form.Item
                  name="multiplier"
                  label="Multiplicateur"
                  tooltip="Laissez 1 dans la plupart des cas. Exemple : 1.1 pour ajouter 10% de marge."
                >
                  <InputNumber min={0} size="large" className="w-full" />
                </Form.Item>

                <Form.Item name="rounding" label="Arrondi">
                  <Select
                    size="large"
                    options={[
                      { value: "ceil", label: "Toujours arrondir au-dessus" },
                      { value: "floor", label: "Arrondir en-dessous" },
                      { value: "round", label: "Arrondir au plus proche" },
                      { value: "none", label: "Ne pas arrondir" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="sort_order" label="Ordre d'affichage">
                  <InputNumber min={0} size="large" className="w-full" />
                </Form.Item>
              </div>

              {selectedModeHelp && (
                <div className="mt-1 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                  <CheckCircleOutlined className="mr-2" />
                  {selectedModeHelp}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900">4. Quand utiliser ce produit ?</h3>
              <p className="mb-4 text-sm text-gray-500">
                Laissez vide si le produit est toujours valable. Ajoutez une condition si le produit dépend d'un choix client.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item name="condition_tuyau_type" label="Type de tuyau">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Tous"
                    options={[
                      { value: "PERT", label: "PERT" },
                      { value: "PERT-AL-PERT", label: "PERT-AL-PERT" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="condition_type_agrafe" label="Hauteur d'agrafe">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Toutes"
                    options={[
                      { value: 40, label: "40 mm" },
                      { value: 60, label: "60 mm" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="condition_type_isolation" label="Isolation">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Toutes"
                    options={[
                      { value: 0, label: "0 mm" },
                      { value: 15, label: "15 mm" },
                      { value: 30, label: "30 mm" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="condition_pas_de_pose" label="Pas de pose">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Tous"
                    options={[
                      { value: 10, label: "10 cm" },
                      { value: 15, label: "15 cm" },
                      { value: 20, label: "20 cm" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="condition_treillis_type" label="Type de treillis">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Tous"
                    options={[
                      { value: "10x10", label: "10x10" },
                      { value: "15x15", label: "15x15" },
                    ]}
                  />
                </Form.Item>

                <Form.Item name="active" label="Ligne active" valuePropName="checked">
                  <Switch checkedChildren="Oui" unCheckedChildren="Non" />
                </Form.Item>
              </div>

              <Divider className="my-3" />

              <Collapse
                ghost
                items={[
                  {
                    key: "advanced",
                    label: "Réglages avancés JSON",
                    children: (
                      <Form.Item
                        name="conditions"
                        label="Conditions supplémentaires"
                        extra="Optionnel. Les champs simples ci-dessus seront fusionnés avec ce JSON."
                      >
                        <Input.TextArea rows={4} placeholder='{"tuyauType":"PERT","typeAgrafe":40}' />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            </section>

            <div className="sticky bottom-0 -mx-6 -mb-5 flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
              <Button onClick={() => setItemModalOpen(false)}>Annuler</Button>
              <Button htmlType="submit" type="primary" size="large" style={{ background: orange }}>
                Sauvegarder la ligne
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
