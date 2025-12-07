'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import { Hammer, Zap, Euro, Ruler, Thermometer } from 'lucide-react'

type SystemCardProps = {
  img: string
  title: string
  ease: number
  speed: number
  price: number
  height: string
  insulation: string
  slug: string
  surface: string
  setSurface: (val: string) => void
  locale: string
}

export default function SystemCard({
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
  locale,
}: SystemCardProps) {
  const t = useTranslations('Systems')
  const [hover, setHover] = useState(false)

  const s = parseFloat(surface)
  const calculatedPrice = !isNaN(s) && s > 0 ? s * price : null

  // Convertit 0–100 en 1–5 niveaux visuels
  const level = (val: number) => Math.round((val / 100) * 5)

  const renderLevel = (val: number) => {
    const filled = level(val)
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-2 w-5 rounded-sm transition-all duration-300 ${
              n <= filled ? 'bg-orange-500' : 'bg-orange-100'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ type: 'spring', stiffness: 180, damping: 16 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border border-gray-100 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
        <motion.div
          animate={{ scale: hover ? 1.06 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="relative h-full w-full"
        >
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </motion.div>

        <h3 className="absolute bottom-4 left-5 text-xl font-semibold text-white drop-shadow">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Visual indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Hammer className="h-4 w-4 text-orange-500" />
              {t('ease-installation')}
            </div>
            {renderLevel(ease)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Zap className="h-4 w-4 text-orange-500" />
              {t('speed-installation')}
            </div>
            {renderLevel(speed)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Euro className="h-4 w-4 text-orange-500" />
              {t('price')}
            </div>
            {renderLevel(price)}
          </div>
        </div>

        {/* Technical details as badges */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1">
            <Ruler className="h-3.5 w-3.5 text-orange-500" />
            {t('height-installation')} {height}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1">
            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
            {t('insulation')} {insulation}
          </span>
        </div>

        {/* Calculated price */}
        {calculatedPrice !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-right text-lg font-semibold text-orange-600"
          >
            {calculatedPrice.toFixed(2)} €
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            id="surface"
            type="number"
            min={0}
            value={surface}
            placeholder="0"
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500"
            onChange={(e) => setSurface(e.target.value)}
          />
          <span className="text-xs text-gray-500 select-none">m²</span>
        </div>

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
            className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 transition"
          >
            {t('view-package')}
          </Link>
        )}
      </div>
    </motion.div>
  )
}
