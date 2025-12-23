'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';   // ⬅️ NEW
import { motion } from 'framer-motion';
import { FaWhatsapp } from "react-icons/fa";

type Props = { locale: string };

const BUSINESS_TYPES = ['installer','electrician','builder','architect','retailer','other'] as const;
type BusinessType = typeof BUSINESS_TYPES[number];

export default function ProSignupForm({ locale }: Props) {
  const t = useTranslations('ProSignup');

  // NEW: client Supabase compatible Next.js 14+
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [email, setEmail]         = useState('');
  const [companyName, setCompany] = useState('');
  const [vat, setVat]             = useState('');
  const [businessType, setType]   = useState<BusinessType>('installer');

  const [addr1, setAddr1]         = useState('');
  const [addr2, setAddr2]         = useState('');
  const [town, setTown]           = useState('');
  const [county, setCounty]       = useState('');
  const [postcode, setPostcode]   = useState('');

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErr(null);
    setOk(null);

    if (!firstName || !lastName || !phone || !email || !companyName || !vat || !addr1 || !town || !postcode) {
      setErr(t('errors.required'));
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setErr(t('errors.session'));
      return;
    }

    const { data: existing, error: checkError } = await supabase
      .from("pro_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      setErr("Erreur de vérification, veuillez réessayer.");
      return;
    }

    if (existing) {
      setLoading(false);
      setErr("Vous avez déjà une demande en cours ou validée.");
      return;
    }

    const { error } = await supabase.from("pro_applications").insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp: whatsapp || null,
      email,
      company_name: companyName,
      vat,
      business_type: businessType,
      address_line1: addr1,
      address_line2: addr2 || null,
      town,
      county: county || null,
      postcode,
      status: "PENDING"
    });

    setLoading(false);

    if (error) setErr(error.message);
    else setOk(t('success'));
  }
  
  const inputBase =
    "w-full rounded-xl border border-slate-300/70 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 " +
    "transition";

  const labelBase =
    "mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <section className="relative top-12 pt-28 pb-24 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="
            rounded-3xl bg-white/80 backdrop-blur-xl
            border border-slate-200/60
            shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]
            p-8 md:p-10
          "
        >
          {/* Header */}
          <header className="mb-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              {t("subtitle")}
            </p>
          </header>
    
          <form onSubmit={onSubmit} className="space-y-10">
            {/* GRID PRINCIPALE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT – Personal */}
              <section className="rounded-2xl border border-slate-200/60 p-6 space-y-6">
                <h2 className="text-base font-medium text-slate-900">
                  {t("yourDetails")}
                </h2>
    
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelBase}>{t("firstName")}</label>
                    <input
                      className={inputBase}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
    
                  <div>
                    <label className={labelBase}>{t("lastName")}</label>
                    <input
                      className={inputBase}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
    
                  <div>
                    <label className={labelBase}>{t("phone")}</label>
                    <input
                      className={inputBase}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
    
                  <div>
                    <label className={labelBase}>Email</label>
                    <input
                      type="email"
                      className={inputBase}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </section>
    
              {/* RIGHT – Company */}
              <section className="rounded-2xl border border-slate-200/60 p-6 space-y-6">
                <h2 className="text-base font-medium text-slate-900">
                  {t("companyDetails")}
                </h2>
    
                <div className="space-y-5">
                  <div>
                    <label className={labelBase}>{t("company")}</label>
                    <input
                      className={inputBase}
                      value={companyName}
                      onChange={e => setCompany(e.target.value)}
                    />
                  </div>
    
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelBase}>{t("vat")}</label>
                      <input
                        className={inputBase}
                        value={vat}
                        onChange={e => setVat(e.target.value)}
                      />
                    </div>
    
                    <div>
                      <label className={`${labelBase} flex items-center gap-2`}>
                        <FaWhatsapp className="text-green-500 text-sm" />
                        WhatsApp
                      </label>
                      <input
                        className={inputBase}
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                      />
                    </div>
                  </div>
    
                  <div>
                    <label className={labelBase}>{t("businessType")}</label>
                    <select
                      className={inputBase}
                      value={businessType}
                      onChange={e => setType(e.target.value as BusinessType)}
                    >
                      {BUSINESS_TYPES.map(opt => (
                        <option key={opt} value={opt}>
                          {t(`businessTypes.${opt}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            </div>
    
            {/* ADDRESS – full width */}
            <section className="rounded-2xl border border-slate-200/60 p-6 space-y-6">
              <h2 className="text-base font-medium text-slate-900">
                {t("address")}
              </h2>
    
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelBase}>{t("addr1")}</label>
                  <input
                    className={inputBase}
                    value={addr1}
                    onChange={e => setAddr1(e.target.value)}
                  />
                </div>
    
                <div>
                  <label className={labelBase}>
                    {t("addr2")}{" "}
                    <span className="text-slate-400 normal-case">
                      ({t("optional")})
                    </span>
                  </label>
                  <input
                    className={inputBase}
                    value={addr2}
                    onChange={e => setAddr2(e.target.value)}
                  />
                </div>
    
                <div>
                  <label className={labelBase}>{t("town")}</label>
                  <input
                    className={inputBase}
                    value={town}
                    onChange={e => setTown(e.target.value)}
                  />
                </div>
    
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelBase}>{t("county")}</label>
                    <input
                      className={inputBase}
                      value={county}
                      onChange={e => setCounty(e.target.value)}
                    />
                  </div>
    
                  <div>
                    <label className={labelBase}>{t("postcode")}</label>
                    <input
                      className={inputBase}
                      value={postcode}
                      onChange={e => setPostcode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>
    
            {/* Feedback */}
            {err && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
    
            {ok && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                {ok}
              </div>
            )}
    
            {/* CTA */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="
                  inline-flex items-center justify-center
                  rounded-xl bg-orange-600 text-white
                  px-10 py-4 text-sm font-semibold
                  shadow-lg shadow-orange-600/25
                  hover:bg-orange-700 hover:shadow-xl
                  active:scale-[0.98]
                  transition
                  disabled:opacity-50
                "
              >
                {loading ? t("sending") : t("cta")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>  
  );
}
