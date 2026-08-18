'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { useCookieConsent } from '@/context/CookieConsentContext';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('Footer');
  const { openSettings } = useCookieConsent();

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
            <li><Link href={`/${locale}/pro`} className="transition hover:text-orange-600">{t('pro')}</Link></li>
          </ul>

          <div className="space-y-3 text-sm">
            <a href="mailto:info@pexxafloor.be" className="flex items-center gap-2 transition hover:text-orange-600"><Mail className="h-4 w-4" />info@pexxafloor.be</a>
            <a href="tel:+3223439200" className="flex items-center gap-2 transition hover:text-orange-600"><Phone className="h-4 w-4" />+32 494 042 932</a>
          </div>
        </div>

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
