'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {Zap, Smile, BadgeEuro, Layers, Sliders, RefreshCcw} from 'lucide-react';

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');

  const steps = [
    { icon: Zap, title: t('steps.fast.title'), desc: t('steps.fast.desc') },
    { icon: Smile, title: t('steps.simple.title'), desc: t('steps.simple.desc') },
    { icon: BadgeEuro, title: t('steps.transparent.title'), desc: t('steps.transparent.desc') },
    { icon: Layers, title: t('steps.multiple.title'), desc: t('steps.multiple.desc') },
    { icon: Sliders, title: t('steps.customizable.title'), desc: t('steps.customizable.desc') },
    { icon: RefreshCcw, title: t('steps.instantUpdate.title'), desc: t('steps.instantUpdate.desc') }
  ];

  return (
    <section className="bg-white py-16" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          transition={{duration: 0.4}}
          viewport={{once: true}}
          className="text-center text-3xl font-bold text-orange-500 mb-12"
        >
          {t('title')}
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              transition={{duration: 0.4, delay: i * 0.05}}
              viewport={{once: true}}
              className="flex flex-col items-start rounded-xl border border-orange-100 bg-orange-50 p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-700">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
