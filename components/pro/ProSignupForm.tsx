'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { FaWhatsapp } from "react-icons/fa";

type Props = { locale: string };

const BUSINESS_TYPES = ['installer','electrician','builder','architect','retailer','other'] as const;
type BusinessType = typeof BUSINESS_TYPES[number];

export default function ProSignupForm({ locale }: Props) {
  const t = useTranslations('ProSignup');
  const supabase = createClientComponentClient();

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
  
    // 🔍 Vérifier s’il existe déjà une demande pour cet utilisateur
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
  
    // ✅ Créer la nouvelle demande
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
  

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-orange-100 bg-orange-50 p-6 md:p-8 shadow-sm"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-orange-600">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-700">{t('subtitle')}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-8">
            {/* Your details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('yourDetails')}</h2>
              <div className="h-px bg-orange-200 mt-2" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('firstName')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('lastName')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={lastName} onChange={e => setLastName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('phone')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={phone} onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('companyDetails')}</h2>
              <div className="h-px bg-orange-200 mt-2" />
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('company')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={companyName} onChange={e => setCompany(e.target.value)}
                  />
                </div>

                {/* VAT */}
                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('vat')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={vat} onChange={e => setVat(e.target.value)}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="mb-1 block text-sm text-gray-700 flex items-center gap-1">
                    <FaWhatsapp className="text-green-500" /> WhatsApp
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('businessType')}</label>
                  <select
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={businessType}
                    onChange={e => setType(e.target.value as BusinessType)}
                  >
                    {BUSINESS_TYPES.map(opt => (
                      <option key={opt} value={opt}>{t(`businessTypes.${opt}`)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-700">{t('addr1')}</label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={addr1} onChange={e => setAddr1(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-700">
                    {t('addr2')} <span className="text-gray-400">({t('optional')})</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                    value={addr2} onChange={e => setAddr2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">{t('town')}</label>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                      value={town} onChange={e => setTown(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">{t('county')}</label>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                      value={county} onChange={e => setCounty(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-700">{t('postcode')}</label>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
                      value={postcode} onChange={e => setPostcode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
            )}
            {ok && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-600 py-3 text-white font-semibold hover:bg-orange-700 transition disabled:opacity-60"
            >
              {loading ? t('sending') : t('cta')}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
