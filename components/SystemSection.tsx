'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import SystemCard from "./SystemCard"
import { useLocale } from "next-intl"

type SystemsSectionProps = {
  surface: string;
  setSurface: (val: string) => void;
};

export default function SystemsSection({ surface, setSurface }: SystemsSectionProps) {
  const t = useTranslations('Systems');
  const locale = useLocale()

  const systems = [
    {
      img: '/images/treillis-system.jpg',
      title: t('set1.title'),
      ease: 30,
      speed: 40,
      price: 90,
      height: '22mm',
      insulation: t('set1.insulation'),
      slug: "treillis"
    },
    {
      img: '/images/tacker-system.jpg',
      title: t('set2.title'),
      ease: 70,
      speed: 90,
      price: 70,
      height: '38mm',
      insulation: t('set2.insulation'),
      slug: "agrafe"
    },
    {
      img: '/images/plots-system.jpg',
      title: t('set3.title'),
      ease: 90,
      speed: 95,
      price: 80,
      height: t('set3.height'),
      insulation: t('set3.insulation'),
      slug: "natte"
    },
  ];

  return (
    <motion.section
      className="mx-auto py-16 max-w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      id="systems-section"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-3xl font-bold text-orange-600">
          {t('title')}
        </h2>

        <div className="grid w-full gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {systems.map((sys, i) => (
            <SystemCard
              key={i}
              {...sys}
              surface={surface}
              setSurface={setSurface}
              slug={sys.slug}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
