"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, PackageSearch } from "lucide-react";
import { Footer, Navbar } from "@/components";
import { toast } from "sonner";
import { useOrder } from "@/hooks/useOrder";
import InternalFields from "@/components/storekeeper/InternalFields";
import PickingTable from "@/components/storekeeper/PickingTable";
import VerificationTable from "@/components/storekeeper/VerificationTable";

export default function StorekeeperOrderPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const {
    order,
    products,
    setProducts,
    step,
    loading,
    saving,
    loadError,
    reload,
    saveInternal,
    startVerification,
    finishVerification,
  } = useOrder(id);
  const [internalNote, setInternalNote] = useState("");
  const [internalComment, setInternalComment] = useState("");

  useEffect(() => {
    if (order) {
      setInternalNote(order.internal_note || "");
      setInternalComment(order.internal_comment || "");
    }
  }, [order]);

  const saveNotes = async () => {
    const result = await saveInternal(internalNote, internalComment);
    result.error ? toast.error("Impossible d’enregistrer les notes") : toast.success("Notes enregistrées");
  };

  const beginVerification = async () => {
    const result = await startVerification();
    result.error ? toast.error("Toutes les références doivent être préparées") : toast.success("Picking terminé, place à la vérification");
  };

  const complete = async () => {
    const result = await finishVerification();
    if (result.error) return toast.error("La vérification est incomplète");
    toast.success("Commande vérifiée et prête à emballer");
    router.push(`/${locale}/storekeeper`);
  };

  if (loading) {
    return <><Navbar /><main className="min-h-screen bg-slate-50 px-4 pb-20 pt-36"><div className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-8 w-64 rounded bg-slate-200" /><div className="h-28 rounded-2xl bg-white" /><div className="h-96 rounded-2xl bg-white" /></div></main><Footer /></>;
  }

  if (loadError || !order) {
    return <><Navbar /><main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 pt-28"><div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm"><AlertTriangle className="mx-auto text-red-500" /><h1 className="mt-4 text-xl font-bold">Commande inaccessible</h1><p className="mt-2 text-sm text-slate-500">{loadError || "Cette commande est introuvable."}</p><button onClick={reload} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Réessayer</button></div></main><Footer /></>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <button onClick={() => router.push(`/${locale}/storekeeper`)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-600"><ArrowLeft size={17} />Retour aux commandes</button>

          <header className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600"><PackageSearch size={25} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Préparation de commande</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Commande #{id.slice(0, 8)}</h1><p className="mt-1 text-sm text-slate-500">{order.client_name || "Client"} · {products.length} référence{products.length > 1 ? "s" : ""}</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1.5"><div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${step === "picking" ? "bg-white text-orange-700 shadow-sm" : "text-emerald-700"}`}><ClipboardList size={16} />1. Picking</div><div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${step === "verification" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"}`}><CheckCircle2 size={16} />2. Vérification</div></div>
            </div>
          </header>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            {step === "picking" ? <PickingTable products={products} setProducts={setProducts} onFinish={beginVerification} saving={saving} /> : <VerificationTable products={products} setProducts={setProducts} onFinish={complete} saving={saving} />}
            <aside className="xl:sticky xl:top-28"><InternalFields internalNote={internalNote} internalComment={internalComment} setInternalNote={setInternalNote} setInternalComment={setInternalComment} onSave={saveNotes} /></aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
