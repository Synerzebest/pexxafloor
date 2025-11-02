import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {Sparkles, Gauge, Shield, Leaf} from 'lucide-react';

type HeroProps = {
  surface: string;
  setSurface: (val: string) => void;
};

export default function Hero({surface, setSurface}: HeroProps) {
  const t = useTranslations('Hero');

  const fadeUp = {
    hidden: {opacity: 0, y: 14},
    visible: {opacity: 1, y: 0, transition: {duration: 0.45}}
  };

  return (
    <section className="relative overflow-hidden">
      {/* background gradient léger */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-orange-50/40" />
      {/* glow subtil à droite */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 -z-10"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" /> {/* orange-400 */}
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#hero-glow)" />
      </motion.svg>


      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:pb-24 md:pt-20">
        {/* eyebrow */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {t('eyebrow')}
        </motion.p>

        {/* Title : sobre + accent orange sur la 2e ligne */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{delay: 0.06}}
          className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl"
        >
          {t('title.line1')}{' '}
          <span className="text-orange-600">{t('title.line2')}</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{delay: 0.12}}
          className="mt-4 max-w-2xl text-base text-gray-700 md:text-lg"
        >
          {t('subtitle')}
        </motion.p>

        {/* input + CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{delay: 0.18}}
          className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          <label htmlFor="surface" className="sr-only">{t('surfaceLabel')}</label>
          <div className="relative flex-1">
            <input
              id="surface"
              type="text"
              inputMode="decimal"
              placeholder={t('surfacePlaceholder')}
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/95 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-300/40"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
              m²
            </span>
          </div>

          <button
            disabled={isNaN(parseFloat(surface)) || parseFloat(surface) <= 0}
            onClick={() => {
              document.getElementById('systems-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`rounded-xl px-5 py-3 text-center text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/60
              ${isNaN(parseFloat(surface)) || parseFloat(surface) <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'}
            `}
          >
            {t('cta')}
          </button>
        </motion.div>

        {/* bullets avantages */}
        <motion.ul
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{delay: 0.24}}
          className="mt-8 grid grid-cols-1 gap-3 text-sm text-gray-800 sm:grid-cols-2 md:grid-cols-3"
        >
          <li className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 shadow-sm">
            <Gauge className="h-4 w-4 text-orange-600" />
            {t('points.fast')}
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 shadow-sm">
            <Shield className="h-4 w-4 text-orange-600" />
            {t('points.trust')}
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-2 shadow-sm">
            <Leaf className="h-4 w-4 text-orange-600" />
            {t('points.efficient')}
          </li>
        </motion.ul>
      </div>
    </section>
  );
}
