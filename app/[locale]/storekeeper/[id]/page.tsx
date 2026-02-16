"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar, Footer } from "@/components";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import InternalFields from "@/components/storekeeper/InternalFields";
import PickingTable from "@/components/storekeeper/PickingTable";
import VerificationTable from "@/components/storekeeper/VerificationTable";

export default function StorekeeperOrderPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    order,
    products,
    setProducts,
    step,
    setStep,
    loading,
    updateOrder,
  } = useOrder(id as string);

  // Champs internes locaux
  const [internalNote, setInternalNote] = useState("");
  const [internalComment, setInternalComment] = useState("");

  useEffect(() => {
    if (order) {
      setInternalNote(order.internal_note || "");
      setInternalComment(order.internal_comment || "");
    }
  }, [order]);

  async function saveInternal() {
    const { error } = await updateOrder({
      internal_note: internalNote,
      internal_comment: internalComment,
    });

    if (error)
      return toast.error("Impossible d'enregistrer");

    toast.success("Informations internes enregistrées");
  }

  async function finishPicking() {
    const { error } = await updateOrder({ status: "packed" });

    if (error)
      return toast.error("Erreur lors de la mise à jour");

    setStep("verification");
    toast.success("Picking terminé");
  }

  async function finishVerification() {
    const mismatch = products.some(
      (p) => p.verified_quantity !== p.picked_quantity
    );

    if (mismatch)
      return toast.warning("Certaines quantités ne correspondent pas");

    const { error } = await updateOrder({
      status: "packed",
      internal_note: internalNote,
      internal_comment: internalComment,
    });

    if (error)
      return toast.error("Erreur lors de la validation");

    toast.success("Commande validée !");
    router.push("/storekeeper");
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="p-6 relative top-24">Chargement...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="p-6 space-y-6 relative top-28">
        <h1 className="text-xl font-bold">
          Commande #{id}{" "}
        </h1>

        <InternalFields
          internalNote={internalNote}
          internalComment={internalComment}
          setInternalNote={setInternalNote}
          setInternalComment={setInternalComment}
          onSave={saveInternal}
        />

        {step === "picking" ? (
          <PickingTable
            products={products}
            setProducts={setProducts}
            onFinish={finishPicking}
          />
        ) : (
          <VerificationTable
            products={products}
            setProducts={setProducts}
            onFinish={finishVerification}
          />
        )}
      </div>

      <div className="relative top-36">
        <Footer />
      </div>
    </>
  );
}
