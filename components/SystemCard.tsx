'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link'

type SystemCardProps = {
  img: string;
  title: string;
  ease: number;
  speed: number;
  price: number;
  height: string;
  insulation: string;
  slug: string;
  surface: string;
  setSurface: (val: string) => void;
  locale: string;
};

function SystemCard({
  img,
  title,
  ease,
  speed,
  price,
  height,
  insulation,
  slug,
  surface,
  setSurface,
  locale
}: SystemCardProps) {
  const t = useTranslations('Systems');
  const [hover, setHover] = useState(false);

  // On calcule dynamiquement le prix si surface > 0
  const s = parseFloat(surface);
  const calculatedPrice = !isNaN(s) && s > 0 ? s * price : null;

  return (
    <motion.div
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className="group flex flex-col overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm hover:shadow-md transition"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <motion.div
          animate={{ scale: hover ? 1.06 : 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="h-full w-full"
        >
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover"
            priority={false}
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <h3 className="absolute bottom-3 left-4 right-4 text-lg font-semibold text-white drop-shadow-md">
          {title}
        </h3>
      </div>

      {/* Infos techniques */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-xs text-gray-600">{t('ease-installation')}</p>
          <div className="h-2 rounded bg-orange-100">
            <div className="h-2 rounded bg-orange-500" style={{ width: `${ease}%` }} />
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-600">{t('speed-installation')}</p>
          <div className="h-2 rounded bg-orange-100">
            <div className="h-2 rounded bg-orange-500" style={{ width: `${speed}%` }} />
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-600">{t('price')}</p>
          <div className="h-2 rounded bg-orange-100">
            <div className="h-2 rounded bg-orange-500" style={{ width: `${price}%` }} />
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-700">
          {t('height-installation')} : <span className="font-medium">{height}</span>
        </p>
        <p className="text-xs text-gray-700">
          {t('insulation')} : <span className="font-medium">{insulation}</span>
        </p>

        {/* Affichage du prix calculé */}
        {calculatedPrice !== null && (
          <p className="mt-3 text-lg font-bold text-orange-600">
            {calculatedPrice.toFixed(2)} €
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-orange-100 p-4">
        <div className="flex items-center gap-2">
          <input
            id="surface"
            type="text"
            inputMode="decimal"
            min={0}
            value={surface}
            placeholder="0"
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-800"
            onChange={(e) => setSurface(e.target.value)}
          />
          <span className="select-none text-xs text-gray-600">m²</span>
        </div>

        {/* Bouton dynamique */}
        {calculatedPrice === null ? (
          <button
            disabled
            className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-white cursor-not-allowed"
          >
            {t('calculate')}
          </button>
        ) : (
          <Link
            href={`/${locale}/packs/${slug}?surface=${surface}`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {t('view-package')}
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default SystemCard;
