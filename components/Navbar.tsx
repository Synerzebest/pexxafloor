'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu as LucideMenu, Sparkles, X, ShoppingCart, ChevronRight, Trash2, PhoneCall, Mail, Headphones, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import UserButton from './UserButton';
import ProductSearch from './ProductSearch';
import { useStoreData } from "@/context/StoreDataProvider";
import { useUI } from "@/context/UIContext"
import { useQuotes } from '@/context/QuoteContext';
import { FaWhatsapp } from 'react-icons/fa';

const SUPPORTED_LOCALES = ['fr', 'nl', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const logoImage = "/images/logo.png";
const whatsappUrl = "https://wa.me/3223439200";
type Translatable = {
  name_fr: string;
  name_nl: string;
  name_en: string;
};

function swapLocaleInPath(pathname: string, nextLocale: SupportedLocale) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${nextLocale}`;
  if (SUPPORTED_LOCALES.includes(parts[0] as SupportedLocale)) {
    parts[0] = nextLocale;
  } else {
    parts.unshift(nextLocale);
  }
  return '/' + parts.join('/');
}

export default function Navbar() {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  
  const t = useTranslations('Navbar');
  const { items, openCart } = useCart();
  const {
    quotes,
    isQuoteListOpen,
    closeQuoteList,
    loadQuote,
    deleteQuote,
  } = useQuotes();

  const { drawerOpen, setDrawerOpen } = useUI()
  const { categories, loading } = useStoreData();
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [openMobileCat, setOpenMobileCat] = useState<string | null>(null);
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
    setContactOpen(false);
  }, [pathname, setDrawerOpen]);

  const getName = (obj: Translatable) =>
    locale === 'fr' ? obj.name_fr : locale === 'nl' ? obj.name_nl : obj.name_en;

  const onChangeLocale = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as SupportedLocale;
    router.push(swapLocaleInPath(pathname, nextLocale));
    setDrawerOpen(false);
  };

  const hoveredCategory = categories.find((c) => c.id === hoveredCat);

  return (
    <header className="fixed inset-x-0 top-0 z-20 w-full border-b border-gray-200 bg-white">
      {/* --- Bandeau principal --- */}
      <div className="flex items-center justify-between gap-4 px-4 bg-white">
        {/* Logo */}
        <Link href={`/${locale}`} className="shrink-0">
          <Image
            src={logoImage}
            alt="Logo"
            width={110}
            height={80}
            priority
            className="h-auto w-auto object-contain"
          />
        </Link>

        {/* Liens centraux */}
        <div className="flex-1 max-w-2xl hidden sm:block">
          <ProductSearch />
        </div>

        {/* Contact expert */}
        <div className="relative hidden shrink-0 lg:block">
          <button
            type="button"
            onClick={() => setContactOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-100 cursor-pointer"
            aria-expanded={contactOpen}
            aria-haspopup="dialog"
          >
            <Headphones className="h-4 w-4" aria-hidden="true" />
            {t('expert_contact')}
            <ChevronDown className={`h-4 w-4 transition-transform ${contactOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {contactOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
              >
                <a href="tel:+32494042932" onClick={() => setContactOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-orange-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><PhoneCall size={17} /></span>
                  <span><span className="block text-xs text-gray-400">{t('contact_phone')}</span><span className="text-sm font-medium text-gray-800">+32 494 042 932</span></span>
                </a>
                <a href="mailto:info@pexxafloor.be" onClick={() => setContactOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-orange-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><Mail size={17} /></span>
                  <span><span className="block text-xs text-gray-400">{t('contact_email')}</span><span className="text-sm font-medium text-gray-800">info@pexxafloor.be</span></span>
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setContactOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-emerald-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><FaWhatsapp size={18} /></span>
                  <span><span className="block text-xs text-gray-400">WhatsApp</span><span className="text-sm font-medium text-gray-800">+32 494 042 932</span></span>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Profil / Panier / Langue */}
        <div className="hidden md:flex items-center gap-3">
          <UserButton />
          
          <motion.button
            whileHover={{scale: 1.1}}
            onClick={openCart}
            className="relative cursor-pointer"
            aria-label={t('cart')}
          >
            <ShoppingCart />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-xs px-1">
                {items.length}
              </span>
            )}
          </motion.button>

          <motion.div
            whileHover={{scale: 1.05}}
          >
            <Link
              href={`/${locale}/quote`}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {t('quote_btn')}
            </Link>
          </motion.div>

          <select
            value={locale}
            onChange={onChangeLocale}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="fr">FR</option>
            <option value="nl">NL</option>
            <option value="en">EN</option>
          </select>
        </div>

        {/* Burger (mobile) */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          onClick={() => setDrawerOpen(true)}
        >
          <LucideMenu />
        </button>
      </div>

      {!loading && (
        <div
          className="hidden md:block bg-gray-800 relative"
          onMouseLeave={() => setHoveredCat(null)}
        >
          {/* Ligne catégories */}
          <div className="flex gap-8 px-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="py-1"
                onMouseEnter={() => setHoveredCat(cat.id)}
              >
                <Link
                  href={`/${locale}/categories/${cat.slug}`}
                  className={`text-sm font-medium transition-colors
                    ${
                      hoveredCat === cat.id
                        ? 'text-orange-600'
                        : 'text-gray-100 hover:text-orange-600'
                    }
                  `}
                >
                  {getName(cat)}
                </Link>
              </div>
            ))}
          </div>

          {/* Mega menu */}
          <AnimatePresence>
            {hoveredCategory && hoveredCategory.subcategories?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full w-full bg-white shadow-xl z-50"
              >
                <div className="mx-auto max-w-8xl px-8 py-6 flex gap-8">
                  {/* Image à gauche */}
                  {hoveredCategory.image_url ? (
                    <div className="shrink-0">
                      <Image
                        src={hoveredCategory.image_url}
                        alt={getName(hoveredCategory)}
                        width={140}
                        height={140}
                        className="object-contain"
                      />
                    </div>
                  ) : null}

                  {/* Liens à droite */}
                  <div className="grid grid-cols-4 gap-8 flex-1">
                    {hoveredCategory.subcategories.map((sub) => (
                      <div key={sub.id} className="flex flex-col gap-2">
                        {sub.subsubcategories?.length ? (
                          <Link 
                            href={`/${locale}/categories/${hoveredCategory.slug}`} 
                            className="font-semibold text-gray-900 hover:text-orange-600 cursor-pointer"
                          >
                            {getName(sub)}
                          </Link>
                        ) : (
                          <Link
                            href={`/${locale}/categories/${hoveredCategory.slug}/${sub.slug}`}
                            className="font-semibold text-gray-900 hover:text-orange-600"
                          >
                            {getName(sub)}
                          </Link>
                        )}

                        {sub.subsubcategories?.map((ss) => (
                          <Link
                            key={ss.id}
                            href={`/${locale}/categories/${hoveredCategory.slug}/${sub.slug}/${ss.slug}`}
                            className="text-sm text-gray-600 hover:text-orange-600 flex items-center gap-1"
                          >
                            <ChevronRight size={14} />
                            {getName(ss)}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- Drawer mobile --- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-100 h-full w-80 max-w-[85%] bg-white shadow-xl p-4 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xl font-bold text-gray-900">PexxaFloor</p>
                <button
                  className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X />
                </button>
              </div>

              {/* Liens */}
              <ul className="flex flex-col gap-3 mt-2 flex-1">
                <li>
                  <Link onClick={() => setDrawerOpen(false)} href={`/${locale}`} className="block px-1 py-2 text-gray-800">
                    {t('home')}
                  </Link>
                </li>
                <li><ProductSearch /></li>
                {categories.map((cat) => (
                  <li key={cat.id} className="border-b border-gray-100">
                    {/* CATÉGORIE */}
                    <button
                      onClick={() =>
                        setOpenMobileCat(openMobileCat === cat.id ? null : cat.id)
                      }
                      className="flex w-full items-center justify-between px-2 py-3 text-base font-medium text-gray-900"
                    >
                      {getName(cat)}
                      <ChevronRight
                        size={18}
                        className={`transition-transform ${
                          openMobileCat === cat.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* SOUS-CATÉGORIES */}
                    <AnimatePresence>
                      {openMobileCat === cat.id && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-4 overflow-hidden"
                        >
                          {cat.subcategories.map((sub) => {
                            const hasSubSub = sub.subsubcategories?.length > 0;

                            return (
                              <li key={sub.id}>
                                {hasSubSub ? (
                                  <>
                                    {/* Sous-cat accordéon */}
                                    <button
                                      onClick={() =>
                                        setOpenMobileSub(
                                          openMobileSub === sub.id ? null : sub.id
                                        )
                                      }
                                      className="flex w-full items-center justify-between px-2 py-2 text-sm text-gray-700"
                                    >
                                      {getName(sub)}
                                      <ChevronRight
                                        size={14}
                                        className={`transition-transform ${
                                          openMobileSub === sub.id ? "rotate-90" : ""
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {openMobileSub === sub.id && (
                                        <motion.ul
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="pl-4"
                                        >
                                          {sub.subsubcategories!.map((ss) => (
                                            <li key={ss.id}>
                                              <Link
                                                href={`/${locale}/categories/${cat.slug}/${sub.slug}/${ss.slug}`}
                                                onClick={() => setDrawerOpen(false)}
                                                className="block px-2 py-2 text-sm text-gray-500 hover:text-orange-600"
                                              >
                                                {getName(ss)}
                                              </Link>
                                            </li>
                                          ))}
                                        </motion.ul>
                                      )}
                                    </AnimatePresence>
                                  </>
                                ) : (
                                  /* Sous-cat lien direct */
                                  <Link
                                    href={`/${locale}/categories/${cat.slug}/${sub.slug}`}
                                    onClick={() => setDrawerOpen(false)}
                                    className="block px-2 py-2 text-sm text-gray-700 hover:text-orange-600"
                                  >
                                    {getName(sub)}
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>

              {/* --- Bloc Profil / Panier / Langue --- */}
              <div className="mt-4 border-t pt-3 flex flex-col gap-4">
                {/* Ligne 1 : Profil + Panier */}
                <div className="flex items-center gap-3">
                  <UserButton />
                  <button
                    onClick={() => {
                      openCart();
                      setDrawerOpen(false);
                    }}
                    className="relative cursor-pointer"
                    aria-label={t('cart')}
                  >
                    <ShoppingCart />
                    {items.length > 0 && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-xs px-1">
                        {items.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Ligne 2 : Bouton + Sélecteur de langue */}
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/${locale}/quote`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
                  >
                    {t('quote_btn')}
                  </Link>
                  <select
                    value={locale}
                    onChange={onChangeLocale}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="fr">FR</option>
                    <option value="nl">NL</option>
                    <option value="en">EN</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setContactOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700"
                  aria-expanded={contactOpen}
                >
                  <span className="flex items-center gap-2"><Headphones size={17} />{t('expert_contact')}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {contactOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      <a href="tel:+32494042932" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-800"><PhoneCall className="text-orange-500" size={16} />+32 494 042 932</a>
                      <a href="mailto:info@pexxafloor.be" className="flex items-center gap-3 border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-800"><Mail className="text-orange-500" size={16} />info@pexxafloor.be</a>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-800"><FaWhatsapp className="text-emerald-600" size={17} />WhatsApp · +32 2 343 92 00</a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuoteListOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[110] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeQuoteList}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-[111] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Mes devis
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Sélectionnez un devis enregistré pour continuer à travailler dessus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeQuoteList}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto">
                {quotes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Aucun devis enregistré pour le moment.
                  </div>
                ) : (
                  quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-orange-200 hover:bg-orange-50"
                    >
                      <button
                        type="button"
                        onClick={() => loadQuote(quote)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {quote.projectReference}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Pack {quote.slug} · {quote.surface} m² · {quote.total.toFixed(2)} €
                          </p>
                          {(quote.customerName || quote.projectType) && (
                            <p className="mt-1 text-xs text-gray-400">
                              {[quote.customerName, quote.projectType].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(quote.savedAt).toLocaleDateString("fr-BE")}
                        </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Supprimer le devis « ${quote.projectReference} » ?`)) return;
                          try {
                            await deleteQuote(quote.id);
                          } catch (error) {
                            console.error(error);
                            window.alert("Impossible de supprimer ce devis.");
                          }
                        }}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Supprimer le devis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
