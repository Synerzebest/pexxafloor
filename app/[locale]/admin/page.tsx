'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from "@/components";
import { useLocale } from 'next-intl';
import { Package, FolderKanban, ShoppingBasket, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, Variants } from 'framer-motion';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3, ease: "easeOut" }
  }),
};

const AdminPage = () => {
  const locale = useLocale();
  const t = useTranslations('Admin');

  return (
    <>
      <main className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-bold text-gray-900 mb-8"
          >
            {t('adminPanel')}
          </motion.h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Bloc Catalog */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Link
                href={`/${locale}/admin/catalog`}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:border-orange-400 block"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {t('catalogManagement')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t('catalogManagementDetails')}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Bloc Pro Requests */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Link
                href={`/${locale}/admin/pro-requests`}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:border-orange-400 block"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {t('professionalRequests')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t('professionalRequestsDetails')}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Bloc Orders */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Link
                href={`/${locale}/admin/orders`}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:border-orange-400 block"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                    <ShoppingBasket className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {t('orderManagement')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t('orderManagementDetails')}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Bloc rôles utilisateurs */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Link
                href={`/${locale}/admin/roles`}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all hover:border-orange-400 block"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {t('userRolesManagement')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t('userRolesManagementDetails')}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminPage;
