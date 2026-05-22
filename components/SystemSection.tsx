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

type SystemPack = {
  id: string;
  slug: string;
  name_fr: string;
  name_nl: string;
  name_en: string;
  image_url?: string | null;
  installation_ease?: number | null;
  installation_speed?: number | null;
  price_level?: number | null;
  installation_height_fr?: string | null;
  installation_height_nl?: string | null;
  installation_height_en?: string | null;
  insulation_fr?: string | null;
  insulation_nl?: string | null;
  insulation_en?: string | null;
};

export default function SystemsSection({ surface, setSurface }: SystemsSectionProps) {
  const t = useTranslations('Systems');
  const locale = useLocale()
  const [packs, setPacks] = useState<SystemPack[]>([]);
  const [packPrices, setPackPrices] = useState<Record<string, number | null>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPacks() {
      const res = await fetch("/api/packs");
      if (!res.ok) return;

      const data = await res.json();
      if (!cancelled) setPacks(data || []);
    }

    fetchPacks();

    return () => {
      cancelled = true;
    };
  }, []);

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
        packs.map(async (pack) => {
          try {
            const res = await fetch(`/api/packs/${pack.slug}/calculate`, {
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

            if (!res.ok) return [pack.slug, null] as const;

            const data = await res.json();
            return [pack.slug, Number(data.total)] as const;
          } catch {
            return [pack.slug, null] as const;
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
  }, [surface, packs]);

  function localized(pack: SystemPack, field: "name" | "installation_height" | "insulation") {
    const localizedValue = pack[`${field}_${locale}` as keyof SystemPack];
    const frenchValue = pack[`${field}_fr` as keyof SystemPack];
    return String(localizedValue || frenchValue || "");
  }

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
          {packs.map((pack) => (
            <SystemCard
              key={pack.id}
              img={pack.image_url || "/images/box.png"}
              title={localized(pack, "name")}
              ease={Number(pack.installation_ease ?? 50)}
              speed={Number(pack.installation_speed ?? 50)}
              price={Number(pack.price_level ?? 50)}
              height={localized(pack, "installation_height")}
              insulation={localized(pack, "insulation")}
              surface={surface}
              setSurface={setSurface}
              slug={pack.slug}
              locale={locale}
              calculatedTotal={packPrices[pack.slug] ?? null}
              priceLoading={pricesLoading}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
