'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import SystemCard from "./SystemCard"
import { useLocale } from "next-intl"
import { useEffect, useState } from 'react';

type SystemsSectionProps = {
  surface: string;
  setSurface: (val: string) => void;
};

export default function SystemsSection({ surface, setSurface }: SystemsSectionProps) {
  const t = useTranslations('Systems');
  const locale = useLocale()
  const [packPrices, setPackPrices] = useState<Record<string, number | null>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

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

  useEffect(() => {
    const parsedSurface = Number(surface);

    if (!parsedSurface || parsedSurface <= 0) {
      setPackPrices({});
      setPricesLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPackPrices() {
      setPricesLoading(true);

      const results = await Promise.all(
        systems.map(async (system) => {
          try {
            const res = await fetch(`/api/packs/${system.slug}/calculate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                surface: parsedSurface,
                pasDePose: 20,
                tuyauType: "PERT",
                typeAgrafe: 40,
                typeIsolation: 0,
              }),
            });

            if (!res.ok) return [system.slug, null] as const;

            const data = await res.json();
            return [system.slug, Number(data.total)] as const;
          } catch {
            return [system.slug, null] as const;
          }
        })
      );

      if (!controller.signal.aborted) {
        setPackPrices(Object.fromEntries(results));
        setPricesLoading(false);
      }
    }

    fetchPackPrices();

    return () => controller.abort();
  }, [surface]);

  return (
    <motion.section
      className="mx-auto py-16 max-w-7xl relative top-28 pb-36"
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
              calculatedTotal={packPrices[sys.slug] ?? null}
              priceLoading={pricesLoading}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
