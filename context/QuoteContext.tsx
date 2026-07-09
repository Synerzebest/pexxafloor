"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { PackProduct } from "@/types/PackProductType";

export type PackQuoteDraft = {
  quoteId?: string;
  projectReference?: string;
  slug: string;
  pack_id?: string;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  typeIsolation: 0 | 15 | 30;
  calepinage: boolean;
  quantities: Record<string, number>;
  selectedOptions?: Record<string, boolean>;
  products: PackProduct[];
  total: number;
};

export type SavedPackQuote = PackQuoteDraft & {
  id: string;
  projectReference: string;
  savedAt: string;
};

type QuoteContextType = {
  quotes: SavedPackQuote[];
  currentDraft: PackQuoteDraft | null;
  isQuoteListOpen: boolean;
  setCurrentDraft: (draft: PackQuoteDraft | null) => void;
  saveQuote: (
    draft: PackQuoteDraft,
    projectReference: string,
    options?: { updateExisting?: boolean }
  ) => Promise<SavedPackQuote>;
  getQuote: (id: string) => SavedPackQuote | undefined;
  openQuoteList: () => void;
  closeQuoteList: () => void;
  loadQuote: (quote: SavedPackQuote) => void;
};

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

function getLocaleFromPath(pathname: string | null) {
  const locale = pathname?.split("/").filter(Boolean)[0];
  return locale || "fr";
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [quotes, setQuotes] = useState<SavedPackQuote[]>([]);
  const [currentDraft, setCurrentDraft] = useState<PackQuoteDraft | null>(null);
  const [isQuoteListOpen, setIsQuoteListOpen] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<SavedPackQuote | null>(null);
  const [isSavingBeforeOpen, setIsSavingBeforeOpen] = useState(false);

  const refreshQuotes = async (redirectOnUnauthorized = false) => {
    const response = await fetch("/api/pack-quotes", {
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      setQuotes([]);
      if (redirectOnUnauthorized) {
        router.push(`/${getLocaleFromPath(pathname)}/login`);
      }
      return;
    }

    if (!response.ok) {
      console.error("Erreur chargement devis :", await response.text());
      return;
    }

    const data = (await response.json()) as SavedPackQuote[];
    setQuotes(data);
  };

  useEffect(() => {
    refreshQuotes(false);
  }, []);

  const saveQuote = async (
    draft: PackQuoteDraft,
    projectReference: string,
    options?: { updateExisting?: boolean }
  ) => {
    const quoteId = options?.updateExisting ? draft.quoteId : undefined;
    const response = await fetch("/api/pack-quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...draft, quoteId, projectReference }),
    });

    if (response.status === 401) {
      router.push(`/${getLocaleFromPath(pathname)}/login`);
      throw new Error("Connexion requise pour enregistrer un devis.");
    }

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const quote = (await response.json()) as SavedPackQuote;
    setQuotes((prev) => {
      const exists = prev.some((item) => item.id === quote.id);
      if (exists) {
        return prev.map((item) => (item.id === quote.id ? quote : item));
      }
      return [quote, ...prev];
    });

    setCurrentDraft({
      ...draft,
      quoteId: options?.updateExisting ? quote.id : undefined,
      projectReference: options?.updateExisting ? projectReference : undefined,
    });
    return quote;
  };

  const openSavedQuote = (quote: SavedPackQuote) => {
    const locale = getLocaleFromPath(pathname);
    setCurrentDraft(quote);
    setIsQuoteListOpen(false);
    setPendingQuote(null);
    router.push(`/${locale}/packs/${quote.slug}?quoteId=${quote.id}`);
  };

  const loadQuote = (quote: SavedPackQuote) => {
    const isPackPage = pathname?.includes("/packs/");
    const isDifferentQuote = currentDraft?.quoteId !== quote.id;

    if (isPackPage && currentDraft && isDifferentQuote) {
      setPendingQuote(quote);
      return;
    }

    openSavedQuote(quote);
  };

  const value = useMemo(
    () => ({
      quotes,
      currentDraft,
      isQuoteListOpen,
      setCurrentDraft,
      saveQuote,
      getQuote: (id: string) => quotes.find((quote) => quote.id === id),
      openQuoteList: () => {
        setIsQuoteListOpen(true);
        refreshQuotes(true);
      },
      closeQuoteList: () => setIsQuoteListOpen(false),
      loadQuote,
    }),
    [quotes, currentDraft, isQuoteListOpen, pathname]
  );

  const handleSaveThenOpen = async () => {
    if (!currentDraft || !pendingQuote) return;

    const defaultReference = currentDraft.projectReference || "";
    const projectReference = window.prompt(
      "Référence de projet",
      defaultReference
    );

    if (!projectReference?.trim()) return;

    try {
      setIsSavingBeforeOpen(true);
      await saveQuote(currentDraft, projectReference.trim(), {
        updateExisting: Boolean(currentDraft.quoteId),
      });
      openSavedQuote(pendingQuote);
    } catch (error) {
      console.error(error);
      window.alert("Impossible d’enregistrer le devis avant ouverture.");
    } finally {
      setIsSavingBeforeOpen(false);
    }
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}

      {pendingQuote && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Ouvrir ce devis ?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Vous travaillez déjà sur un devis. Voulez-vous l’abandonner ou
              l’enregistrer avant d’ouvrir « {pendingQuote.projectReference} » ?
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingQuote(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => openSavedQuote(pendingQuote)}
                className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
              >
                Abandonner
              </button>
              <button
                type="button"
                onClick={handleSaveThenOpen}
                disabled={isSavingBeforeOpen}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingBeforeOpen ? "Enregistrement..." : "Enregistrer puis ouvrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </QuoteContext.Provider>
  );
}

export const useQuotes = () => {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuoteProvider");
  return ctx;
};
