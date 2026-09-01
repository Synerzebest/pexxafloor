'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Crown, Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useAuth } from '@/context/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('Footer');
  const { openSettings } = useCookieConsent();
  const { user } = useAuth();
  const { isPro, profileName, loading: profileLoading } = useUserProfile();
  const memberName = profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('proMemberFallback');

  return (
    <footer className="bg-orange-50 text-gray-700 mt-20 border-t border-orange-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
      >
        {/* === TOP SECTION === */}
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* Logo + Tagline */}
          <div>
            <p className="text-2xl font-bold text-orange-600">PexxaFloor</p>
            <p className="text-sm text-gray-500 mt-1">{t('tagline')}</p>
          </div>

          {/* Navigation */}
          <ul className="space-y-3 text-sm font-medium">
            <li><Link href={`/${locale}/categories`} className="transition hover:text-orange-600">{t('products')}</Link></li>
            <li><Link href={`/${locale}/quote`} className="transition hover:text-orange-600">{t('quote')}</Link></li>
            {!profileLoading && !isPro && (
              <li><Link href={`/${locale}/pro`} className="transition hover:text-orange-600">{t('pro')}</Link></li>
            )}
          </ul>

          <div className="space-y-3 text-sm">
            <a href="mailto:info@pexxafloor.be" className="flex items-center gap-2 transition hover:text-orange-600"><Mail className="h-4 w-4" />info@pexxafloor.be</a>
            <a href="tel:+32494042932" className="flex items-center gap-2 transition hover:text-orange-600"><Phone className="h-4 w-4" />+32 494 042 932</a>
          </div>
        </div>

        {!profileLoading && isPro && (
          <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-600 text-white shadow-sm">
                  <Crown className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">{t('proMemberEyebrow')}</p>
                  <p className="mt-1 text-lg font-bold text-gray-950">{t('proMemberTitle', { name: memberName })}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{t('proMemberDescription')}</p>
                </div>
              </div>
              <ul className="grid gap-2 text-sm text-gray-700 sm:grid-cols-3 lg:grid-cols-1">
                {(['proBenefitPrices', 'proBenefitQuotes', 'proBenefitSupport'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* === PAYMENT SECTION === */}
      <div className="border-t border-orange-200 pt-10">
        <div
          className="
            flex justify-center flex-wrap items-center gap-6"
        >
          <Image src="/images/payments/visa.svg" alt="Visa" width={55} height={35} />
          <Image src="/images/payments/mastercard.svg" alt="Mastercard" width={55} height={35} />
          <Image src="/images/payments/amex.svg" alt="American Express" width={55} height={35} />
          <Image src="/images/payments/applepay.svg" alt="Apple Pay" width={55} height={35} />
          <Image src="/images/payments/googlepay.svg" alt="Google Pay" width={55} height={35} />
          <Image src="/images/payments/klarna.svg" alt="Klarna" width={55} height={35} />
          <Image src="/images/payments/stripe.svg" alt="Stripe" width={55} height={35} />
        </div>
      </div>


        {/* === BOTTOM SECTION === */}
        <div className="h-px bg-orange-200" />

        <div className="flex flex-col justify-between gap-4 text-xs text-gray-500 lg:flex-row lg:items-center">
          <p>© {new Date().getFullYear()} PexxaFloor. {t('rights')}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href={`/${locale}/legal`} className="hover:text-orange-600 transition">{t('legal')}</Link>
            <Link href={`/${locale}/privacy`} className="hover:text-orange-600 transition">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-orange-600 transition">
              {t('terms')}
            </Link>
            <Link href={`/${locale}/cookies`} className="hover:text-orange-600 transition">{t('cookies')}</Link>
            <button type="button" onClick={openSettings} className="hover:text-orange-600 transition">{t('cookieSettings')}</button>
            <Link href={`/${locale}/withdrawal`} className="hover:text-orange-600 transition">{t('withdrawal')}</Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
