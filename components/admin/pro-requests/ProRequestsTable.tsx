'use client';

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useProRequestsLogic } from "@/hooks/useProRequestsLogic";
import { RequestsSection } from "./RequestsSection";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import type { AppRow } from "@/types/AppRowType";
import { RequestRow } from "./RequestRow"

type Props = {
  pending: AppRow[];
  recent: AppRow[];
};

export default function ProRequestsTable({
  pending,
  recent,
}: Props) {

  const t = useTranslations("AdminPro");
  const { busyId, error, act } = useProRequestsLogic();
  const [search, setSearch] = useState("");

  function matchesSearch(r: AppRow) {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.first_name?.toLowerCase().includes(q) ||
      r.last_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.whatsapp?.toLowerCase().includes(q) ||
      r.company_name?.toLowerCase().includes(q) ||
      r.vat?.toLowerCase().includes(q) ||
      r.business_type?.toLowerCase().includes(q) ||
      r.address_line1?.toLowerCase().includes(q) ||
      r.address_line2?.toLowerCase().includes(q) ||
      r.town?.toLowerCase().includes(q) ||
      r.county?.toLowerCase().includes(q) ||
      r.postcode?.toLowerCase().includes(q)
    );
  }

  const allRequests = [...pending, ...recent];
  const searchResults = allRequests.filter(matchesSearch);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-orange-600"
        >
          {t("title")}
        </motion.h1>

        <SearchBar search={search} setSearch={setSearch} />

        {search.trim() ? (
          <SearchResults
            results={searchResults}
            renderRow={(r, i) => (
              <RequestRow
                key={r.id}
                request={r}
                open={false}
                toggle={() => {}}
                busyId={busyId}
                act={act}
                t={t}
              />
            )}
          />
        ) : (
          <>
            <RequestsSection
              title={t("pendingTitle")}
              rows={pending}
              busyId={busyId}
              act={act}
              t={t}
            />
            <RequestsSection
              title={t("recentTitle")}
              rows={recent}
              busyId={busyId}
              act={act}
              t={t}
            />
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

      </div>
    </section>
  );
}
