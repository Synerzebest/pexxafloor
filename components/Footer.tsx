'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('Footer');

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo + Tagline */}
          <div>
            <p className="text-2xl font-bold text-orange-600">PexxaFloor</p>
            <p className="text-sm text-gray-500 mt-1">{t('tagline')}</p>
          </div>

          {/* Navigation */}
          <ul className="flex flex-wrap justify-start gap-6 text-sm font-medium">
            <li>
              <Link href={`/${locale}`} className="hover:text-orange-600 transition">
                {t('home')}
              </Link>
            </li>
            <li>
              <button
                onClick={() =>
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-orange-600 transition"
              >
                {t('how-it-works')}
              </button>
            </li>
            <li>
              <Link href={`/${locale}/benefits`} className="hover:text-orange-600 transition">
                {t('benefits')}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`} className="hover:text-orange-600 transition">
                {t('contact')}
              </Link>
            </li>
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4">
            <Link href="#" className="hover:text-orange-600 transition" aria-label="Facebook">
              <Facebook />
            </Link>
            <Link href="#" className="hover:text-orange-600 transition" aria-label="Instagram">
              <Instagram />
            </Link>
            <Link href="#" className="hover:text-orange-600 transition" aria-label="LinkedIn">
              <Linkedin />
            </Link>
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

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PexxaFloor. {t('rights')}</p>
          <div className="flex gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-orange-600 transition">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-orange-600 transition">
              {t('terms')}
            </Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
