"use client";

import { useEffect, useState } from "react";
import { Table, Select, Space, message, Tooltip, Modal, InputNumber, Form, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Navbar, Footer } from "@/components";
import { Truck, FileText, Edit3, BadgeCheck } from "lucide-react";
import jsPDF from "jspdf";
import { addHeader, addProductsTable, addSignatureAndStampSection, addFooter } from "@/utils/pdfUtils";
import { renderStatus } from "@/utils/renderStatus"
import { Order } from "@/types/OrderType";

export default function StorekeeperPage() {
  const supabase = createClientComponentClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("packed");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      message.error("Erreur lors du chargement des commandes");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const generateDeliveryNote = async (order: Order) => {
    const doc = new jsPDF();
    try {
      addHeader(doc, order);
      addProductsTable(doc, order);
      addSignatureAndStampSection(doc);
      addFooter(doc);
      const fileName = `bon_livraison_${order.id.slice(0, 8)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Erreur génération PDF :", err);
      message.error("Erreur lors de la génération du PDF");
    }
  };

  const generateEtiquettePdf = async (order: Order) => {
    const cartons = order.cartons ?? 0;
    const rouleaux = order.rouleaux ?? 0;
    const bottes = order.bottes ?? 0;
    const client = order.user_id || "Client inconnu";
    const today = new Date().toLocaleDateString("fr-FR");
  
    if (cartons <= 0) {
      message.warning("Aucun carton défini pour cette commande");
      return;
    }
  
    // 📏 Format ajusté d’après ton PDF d’origine
    const doc = new jsPDF({
      orientation: "landscape",
      format: "credit-card"
    });
  
    // === PAGE 1 : ÉTIQUETTE RÉCAPITULATIVE ===  
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    let y = 18;
    const lineSpacing = 10;
    doc.text("Nombre de cartons :", 0, y);
    doc.text(`${cartons}`, 85, y, { align: "right" });
  
    y += lineSpacing;
    doc.text("Nombre de rouleaux :", 0, y);
    doc.text(`${rouleaux}`, 85, y, { align: "right" });
  
    y += lineSpacing;
    doc.text("Nombre de bottes :", 0, y);
    doc.text(`${bottes}`, 85, y, { align: "right" });
  
    // === PAGES SUIVANTES : ÉTIQUETTES UNITAIRES ===
    for (let i = 1; i <= cartons; i++) {
      doc.addPage("credit-card", "landscape");
  
      // Étiquette N°
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`Étiquette N° ${i}`, 0, 7);
  
      // Client
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.text(client, 0, 20);
  
      // Ligne horizontale
      doc.setDrawColor(150);
      doc.line(0, 22, 95, 22);
  
      // Date et position du carton
      doc.setFontSize(14);
      doc.text(`${today}`, 0, 52);
      doc.text(`Carton ${i} de ${cartons}`, 55, 52);
    }
  
    const fileName = `etiquettes_${order.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
    message.success(
      `${cartons + 1} étiquettes générées (${cartons} cartons + 1 récapitulative)`
    );
  };
        
  
  const openLabelModal = (order: Order) => {
    setCurrentOrder(order);
    form.setFieldsValue({
      cartons: order.cartons ?? 0,
      rouleaux: order.rouleaux ?? 0,
      bottes: order.bottes ?? 0,
    });
    setIsModalOpen(true);
  };

  const updateLabels = async () => {
    const values = await form.validateFields();
    if (!currentOrder) return;

    const { error } = await supabase
      .from("orders")
      .update(values)
      .eq("id", currentOrder.id);

    if (error) {
      console.error(error);
      message.error("Erreur lors de la mise à jour des étiquettes");
    } else {
      message.success("Étiquettes mises à jour !");
      setIsModalOpen(false);
      fetchOrders(statusFilter);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      // Suppose que ta table "profiles" contient la colonne "isadmin"
      const { data, error } = await supabase
        .from("profiles")
        .select("isadmin")
        .eq("id", user.id)
        .single();
  
      if (error) {
        console.error(error);
      } else {
        setIsAdmin(data?.isadmin === true);
      }
    };
  
    fetchUserRole();
  }, []);

  const markAsReady = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "ready" })
      .eq("id", orderId);

    if (error) {
      console.error(error);
      message.error("Erreur lors de la mise à jour du statut");
    } else {
      message.success("Commande passée en 'packed'");
      fetchOrders(statusFilter);
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: "N° Commande",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-mono">{id.slice(0, 8)}...</span>,
    },
    {
      title: "Client",
      dataIndex: "client_name",
      key: "client_name",
      render: (client_name) => client_name || "-",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status: string) => renderStatus(status),
    },
    {
      title: "Total (€)",
      dataIndex: "total",
      key: "total",
      render: (val) => Number(val).toFixed(2),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
        {/* 🛠️ Action réservée aux admins */}
          {isAdmin && (
              <>
                <Tooltip title="Modifier les étiquettes">
                    <button
                    className="bg-blue-100 text-blue-700 p-2 rounded-lg cursor-pointer"
                    onClick={() => openLabelModal(record)}
                    >
                    <Edit3 size={20} />
                    </button>
                </Tooltip>

                <Tooltip title="Étiquettes pour cette commande">
                    <button
                    className="bg-amber-100 text-amber-700 p-2 rounded-lg cursor-pointer"
                    onClick={() => generateEtiquettePdf(record)}
                    >
                    <FileText size={20} />
                    </button>
                </Tooltip>



                <Tooltip title="Passer au statut prête">
                    <button
                        className="bg-green-100 text-green-700 p-2 rounded-lg cursor-pointer"
                        onClick={() => markAsReady(record.id)}
                    >
                        <BadgeCheck size={20} />
                    </button>
                </Tooltip>
              </>
            )}

          {/* Bon de livraison */}
          <Tooltip title="Bon de livraison">
            <button
              className="bg-gray-100 text-gray-800 p-2 rounded-lg cursor-pointer"
              onClick={() => generateDeliveryNote(record)}
            >
              <Truck size={20} />
            </button>
          </Tooltip>

        </Space>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="p-6 relative top-28">
        <h1 className="text-2xl font-semibold mb-4">
          Commandes emballées
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <span>Filtrer par statut :</span>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: "En préparation", value: "preparing" },
              { label: "Payées", value: "paid" },
              { label: "Validées", value: "validated" },
              { label: "Prêtes", value: "ready" },
              { label: "Emballées", value: "packed"},
              { label: "Toutes", value: "" },
            ]}
            style={{ width: 200 }}
          />
        </div>

        <Table
          loading={loading}
          dataSource={orders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Modifier les étiquettes"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>,
          <Button key="save" type="primary" onClick={updateLabels}>
            Enregistrer
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Cartons" name="cartons">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Rouleaux" name="rouleaux">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Bottes" name="bottes">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <div className="relative top-36">
        <Footer />
      </div>
    </>
  );
}
