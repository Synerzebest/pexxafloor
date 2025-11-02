'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";

type Status = 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'REVISION';

export type AppRow = {
  id: string;
  created_at: string;
  status: Status;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  company_name: string;
  vat: string | null;
  business_type: string;
  address_line1: string | null;
  address_line2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
};

export default function ProRequestsTable({
  pending,
  recent
}: { locale: string; pending: AppRow[]; recent: AppRow[] }) {
  const t = useTranslations('AdminPro');
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function act(appId: string, action: 'approve' | 'reject' | 'start_review' | 'suspend' | 'revision') {
    setBusyId(appId);
    setError(null);
  
    let fn = '';
    if (action === 'approve') fn = 'approve_pro_application';
    if (action === 'reject') fn = 'reject_pro_application';
    if (action === 'start_review') fn = 'start_review_pro_application';
    if (action === 'suspend') fn = 'suspend_pro_application';
    if (action === 'revision') fn = 'revision_pro_application';
  
    const { error } = await supabase.rpc(fn, { app_id: appId });
    setBusyId(null);
  
    if (error) setError(error.message);
    else router.refresh();
  }

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
  

  const DetailsRow = ({ r }: { r: AppRow }) => (
    <tr className="border-t border-orange-100 bg-orange-50/40">
      <td colSpan={5} className="px-3 py-3">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <div>
            <div className="text-xs font-medium text-gray-600">{t('labels.name')}</div>
            <div className="text-gray-900">{r.first_name} {r.last_name}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {t('labels.email')}
            </div>
            <div className="text-gray-900">{r.email}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> {t('labels.phone')}
            </div>
            <div className="text-gray-900">{r.phone}</div>
          </div>

          {r.whatsapp && (
            <div>
              <div className="text-xs font-medium text-gray-600">WhatsApp</div>
              <div className="text-gray-900">{r.whatsapp}</div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {t('labels.company')}
            </div>
            <div className="text-gray-900">{r.company_name}</div>
          </div>

          {r.vat && (
            <div>
              <div className="text-xs font-medium text-gray-600">{t('labels.vat')}</div>
              <div className="text-gray-900">{r.vat}</div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-600">{t('labels.type')}</div>
            <div className="text-gray-900">{r.business_type}</div>
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {t('labels.address')}
            </div>
            <div className="text-gray-900">
              {r.address_line1 || '-'}{r.address_line2 ? `, ${r.address_line2}` : ''}
              {', '}
              {r.postcode || ''} {r.town || ''}
              {r.county ? `, ${r.county}` : ''}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600">{t('labels.created')}</div>
            <div className="text-gray-900">{new Date(r.created_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600">{t('labels.status')}</div>
            <div className="text-gray-900">
              {t(`status.${r.status.toLowerCase() as 'pending'|'verified'|'rejected'}`)}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  const Section = ({ title, rows }: { title: string; rows: AppRow[] }) => (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-orange-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">{t('th.company')}</th>
              <th className="px-3 py-2 text-left">{t('th.contact')}</th>
              <th className="px-3 py-2 text-left">{t('th.status')}</th>
              <th className="px-3 py-2 text-right">{t('th.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  {t('empty')}
                </td>
              </tr>
            )}

            {rows.map((r, i) => (
              <Fragment key={r.id}>
                <motion.tr
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  className="border-t border-orange-100"
                >
                  {/* Entreprise */}
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium text-gray-900">{r.company_name}</div>
                    <div className="text-xs text-gray-600">{r.business_type}</div>
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3 align-top">
                    <div className="text-gray-900">{r.first_name} {r.last_name}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[160px]">
                      {r.email}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-3 align-top">
                    <span
                      className={
                        r.status === 'PENDING'
                          ? 'rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700'
                          : r.status === 'IN_REVIEW'
                          ? 'rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700'
                          : r.status === 'VERIFIED'
                          ? 'rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'
                          : r.status === 'SUSPENDED'
                          ? 'rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700'
                          : r.status === 'REVISION'
                          ? 'rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700'
                          : 'rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700'
                      }
                    >
                      {t(`status.${r.status.toLowerCase() as Lowercase<Status>}`)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      {/* Bouton voir/masquer détails */}
                      <button
                        onClick={() => setOpenRow(prev => prev === r.id ? null : r.id)}
                        className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-gray-800 hover:bg-orange-50"
                      >
                        {openRow === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {openRow === r.id ? t('hide') : t('view')}
                        </span>
                      </button>

                      {/* PENDING */}
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => act(r.id, 'start_review')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('startReview')}</span>
                        </button>
                      )}

                      {/* IN_REVIEW */}
                      {r.status === 'IN_REVIEW' && (
                        <>
                          <button
                            onClick={() => act(r.id, 'approve')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('approve')}</span>
                          </button>

                          <button
                            onClick={() => act(r.id, 'reject')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('reject')}</span>
                          </button>
                        </>
                      )}

                      {/* VERIFIED */}
                      {r.status === 'VERIFIED' && (
                        <button
                          onClick={() => act(r.id, 'suspend')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-white hover:bg-yellow-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('suspend')}</span>
                        </button>
                      )}

                      {/* REJECTED */}
                      {r.status === 'REJECTED' && (
                        <button
                          onClick={() => act(r.id, 'revision')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-yellow-500 px-3 py-1.5 text-white hover:bg-yellow-600 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('reviewDecision')}</span>
                        </button>
                      )}

                      {/* REVISION */}
                      {r.status === 'REVISION' && (
                        <>
                          <button
                            onClick={() => act(r.id, 'approve')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('approve')}</span>
                          </button>

                          <button
                            onClick={() => act(r.id, 'reject')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('reject')}</span>
                          </button>
                        </>
                      )}

                      {/* SUSPENDED */}
                      {r.status === 'SUSPENDED' && (
                        <button
                          onClick={() => act(r.id, 'approve')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('approve')}</span>
                        </button>
                      )}


                    </div>
                  </td>
                </motion.tr>

                {openRow === r.id && <DetailsRow r={r} />}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );

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
  
        {/* barre de recherche */}
        <SearchBar search={search} setSearch={setSearch} />
  
        {search ? (
          <SearchResults
            results={searchResults}
            renderRow={(r, i) => (
              <motion.tr
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="border-t border-orange-100"
              >
                {/* Entreprise */}
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-gray-900">{r.company_name}</div>
                  <div className="text-xs text-gray-600">{r.business_type}</div>
                </td>
  
                {/* Contact */}
                <td className="px-3 py-3 align-top">
                  <div className="text-gray-900">
                    {r.first_name} {r.last_name}
                  </div>
                  <div className="text-xs text-gray-600 truncate max-w-[160px]">
                    {r.email}
                  </div>
                </td>
  
                {/* Statut */}
                <td className="px-3 py-3 align-top">
                  <span
                    className={
                      r.status === "PENDING"
                        ? "rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700"
                        : r.status === "IN_REVIEW"
                        ? "rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                        : r.status === "VERIFIED"
                        ? "rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                        : r.status === "SUSPENDED"
                        ? "rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
                        : r.status === "REVISION"
                        ? "rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"
                        : "rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                    }
                  >
                    {t(`status.${r.status.toLowerCase() as Lowercase<Status>}`)}
                  </span>
                </td>
  
                {/* Actions */}
                <td className="px-3 py-3 align-top">
                  
                      {/* PENDING */}
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => act(r.id, 'start_review')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('startReview')}</span>
                        </button>
                      )}

                      {/* IN_REVIEW */}
                      {r.status === 'IN_REVIEW' && (
                        <>
                          <button
                            onClick={() => act(r.id, 'approve')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('approve')}</span>
                          </button>

                          <button
                            onClick={() => act(r.id, 'reject')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('reject')}</span>
                          </button>
                        </>
                      )}

                      {/* VERIFIED */}
                      {r.status === 'VERIFIED' && (
                        <button
                          onClick={() => act(r.id, 'suspend')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-white hover:bg-yellow-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('suspend')}</span>
                        </button>
                      )}

                      {/* REJECTED */}
                      {r.status === 'REJECTED' && (
                        <button
                          onClick={() => act(r.id, 'revision')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-yellow-500 px-3 py-1.5 text-white hover:bg-yellow-600 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('reviewDecision')}</span>
                        </button>
                      )}

                      {/* REVISION */}
                      {r.status === 'REVISION' && (
                        <>
                          <button
                            onClick={() => act(r.id, 'approve')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('approve')}</span>
                          </button>

                          <button
                            onClick={() => act(r.id, 'reject')}
                            disabled={busyId === r.id}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span className="hidden sm:inline">{t('reject')}</span>
                          </button>
                        </>
                      )}

                      {/* SUSPENDED */}
                      {r.status === 'SUSPENDED' && (
                        <button
                          onClick={() => act(r.id, 'approve')}
                          disabled={busyId === r.id}
                          className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t('approve')}</span>
                        </button>
                      )}

                </td>
              </motion.tr>
            )}
          />
        ) : (
          <>
            <Section title={t("pendingTitle")} rows={pending} />
            <Section title={t("recentTitle")} rows={recent} />
          </>
        )}
      </div>
    </section>
  );  
}
