'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('Footer');

  return (
    <footer className="bg-orange-50 text-gray-700 mt-16 border-t border-orange-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      >
        {/* Top part */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo + Name */}
          <div>
            <p className="text-2xl font-bold text-orange-600">PexxaFloor</p>
            <p className="text-sm text-gray-500 mt-1">{t('tagline')}</p>
          </div>

          {/* Menu */}
          <ul className="flex flex-wrap gap-4 text-sm font-medium">
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

          {/* Socials */}
          <div className="flex gap-4">
            <Link href="#" className="hover:text-orange-600 transition">
              <Facebook />
            </Link>
            <Link href="#" className="hover:text-orange-600 transition">
              <Instagram />
            </Link>
            <Link href="#" className="hover:text-orange-600 transition">
              <Linkedin />
            </Link>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-orange-200 my-6" />

        {/* Bottom part */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PexxaFloor. {t('rights')}</p>
          <div className="flex gap-3">
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
