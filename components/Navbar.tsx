'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu as LucideMenu, Sparkles, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCart } from "@/context/CartContext";
import UserButton from './UserButton';
import ProductSearch from './ProductSearch';
import { PhoneCall } from 'lucide-react';
import { Category } from "@/types/CategoryType";

const SUPPORTED_LOCALES = ['fr', 'nl', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const logoImage = "/images/logo.png";
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
  const supabase = createClientComponentClient();
  const t = useTranslations('Navbar');
  const { items, openCart } = useCart();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => setDrawerOpen(false), [pathname]);

  // Charger catégories
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
      .from("categories")
      .select(`
        id, slug, name_fr, name_nl, name_en,
        subcategories:subcategories!category_id (
          id, slug, name_fr, name_nl, name_en,
          subsubcategories:subsubcategories!subsubcategories_subcategory_id_fkey (
            id, slug, name_fr, name_nl, name_en
          )
        )
      `)
      .order("order");

  
      if (error) {
        console.error("Erreur fetch catégories:", error);
      } else {
        setCategories(data as Category[]);
      }
    }
  
    fetchCategories();
  }, []);
  
  

  const getName = (obj: Translatable) =>
    locale === 'fr' ? obj.name_fr : locale === 'nl' ? obj.name_nl : obj.name_en;

  const onChangeLocale = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as SupportedLocale;
    router.push(swapLocaleInPath(pathname, nextLocale));
    setDrawerOpen(false);
  };

  return (
    <header className="w-full border-b border-gray-200">
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

        {/* Numéro de téléphone affiché dans la navbar */}
        <div className="hidden lg:flex items-center gap-2 text-gray-700 font-medium">
          <PhoneCall className="text-orange-500" size={20} />
          <a
            href="tel:+3223439200"
            className="hover:text-orange-600 transition-colors"
          >
            +32.2.343.92.00
          </a>
        </div>


        {/* Profil / Panier / Langue */}
        <div className="hidden md:flex items-center gap-3">
          <UserButton />
          
          <motion.button
            whileHover={{scale: 1.1}}
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) router.push(`/${locale}/login`);
              else openCart();
            }}
            className="relative cursor-pointer"
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
              Get a Quote
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

      {/* Bandeau catégories desktop */}
      <div className="hidden md:block bg-gray-800 border-t border-gray-200">
        <div className="flex justify-start gap-8 px-6">
          {categories.length === 0 ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-2">
                  <div className="h-4 w-20 bg-gray-600 rounded animate-pulse" />
                </div>
              ))}
            </>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="relative py-1"
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <Link
                  href={`/${locale}/categories/${cat.slug}`}
                  className="text-sm font-medium text-gray-100 hover:text-orange-600"
                >
                  {getName(cat)}
                </Link>

                {/* Sous-catégories */}
                <AnimatePresence>
                  {hoveredCat === cat.id && cat.subcategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 top-full mt-1 bg-white shadow-md rounded-lg p-3 flex flex-col gap-1 z-50"
                    >
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="flex flex-col">
                          <Link
                            href={`/${locale}/categories/${cat.slug}/${sub.slug}`}
                            className="text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap"
                          >
                            {getName(sub)}
                          </Link>

                          {/* Sous-sous-catégories */}
                          {sub.subsubcategories?.length > 0 && (
                            <div className="ml-3 mt-1 flex flex-col gap-0.5">
                              {sub.subsubcategories.map((ss) => (
                                <Link
                                  key={ss.id}
                                  href={`/${locale}/categories/${cat.slug}/${sub.slug}/${ss.slug}`}
                                  className="text-xs text-gray-500 hover:text-orange-600 whitespace-nowrap"
                                >
                                  {getName(ss)}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- Drawer mobile --- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-80 max-w-[85%] bg-white shadow-xl p-4 flex flex-col"
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
                {categories.map(cat => (
                  <li key={cat.id} className="border-b border-gray-200">
                    <details>
                      <summary className="cursor-pointer px-1 py-2 text-gray-800">{getName(cat)}</summary>
                      <ul className="pl-4">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <details>
                            <summary className="cursor-pointer px-1 py-2 text-sm text-gray-700">
                              {getName(sub)}
                            </summary>
                            <ul className="pl-4">
                              {sub.subsubcategories?.map((ss) => (
                                <li key={ss.id}>
                                  <Link
                                    onClick={() => setDrawerOpen(false)}
                                    href={`/${locale}/categories/${cat.slug}/${sub.slug}/${ss.slug}`}
                                    className="block px-1 py-1 text-sm text-gray-600 hover:text-orange-600"
                                  >
                                    {getName(ss)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </li>
                      ))}
                      </ul>
                    </details>
                  </li>
                ))}
                <li><Link onClick={() => setDrawerOpen(false)} href={`/${locale}/benefits`} className="block px-1 py-2 text-gray-800">{t('benefits')}</Link></li>
                <li><Link onClick={() => setDrawerOpen(false)} href={`/${locale}/contact`} className="block px-1 py-2 text-gray-800">{t('contact')}</Link></li>
              </ul>

              {/* --- Bloc Profil / Panier / Langue --- */}
              <div className="mt-4 border-t pt-3 flex flex-col gap-4">
                {/* Ligne 1 : Profil + Panier */}
                <div className="flex items-center gap-3">
                  <UserButton />
                  <button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) router.push(`/${locale}/login`);
                      else {
                        openCart();
                        setDrawerOpen(false);
                      }
                    }}
                    className="relative cursor-pointer"
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
                    Get a Quote
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
              <div className="mt-4 flex items-center gap-2 text-center text-gray-800 font-medium">
                <PhoneCall className="text-orange-500" size={15} />
                <a href="tel:+3223439200" className="hover:underline">
                  +32 2 343 92 00
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
