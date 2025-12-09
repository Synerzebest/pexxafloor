"use client"

import { Calculator, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { useLocale, useTranslations } from "next-intl";

export default function HowItWorksSection() {
  const locale = useLocale();
  const t = useTranslations('HowItWorks');

  const steps = [
    { number: "01", title: t('steps.first.title'), desc: t('steps.first.desc') },
    { number: "02", title: t('steps.second.title'), desc: t('steps.second.desc') },
    { number: "03", title: t('steps.third.title'), desc: t('steps.third.desc') },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <div className="absolute inset-0 flex justify-center">
        <div className="w-[900px] h-[900px] bg-white blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            {t('title.line1')} <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">{t('title.line2')}</span>
          </h2>

          <p className="text-gray-500 text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 mb-20">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group text-center">

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-orange-300/60 to-transparent" />
              )}

              <div
                className="
                  inline-flex items-center justify-center w-24 h-24 rounded-2xl
                  bg-white border border-gray-200 
                  shadow-[0_0_25px_rgba(255,149,68,0.25)]
                  mb-6 transition-all duration-300
                  group-hover:border-orange-400 
                  group-hover:shadow-[0_0_35px_rgba(255,149,68,0.45)]
                "
              >
                <span className="text-4xl font-bold text-gradient">{step.number}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={`/${locale}/quote`}
            className="
              inline-flex items-center gap-2 px-8 py-4 rounded-xl
              bg-gradient-to-r from-orange-500 to-orange-400
              text-white font-semibold shadow-md
              hover:shadow-lg hover:brightness-105
              transition-all duration-300 group
            "
          >
            <Calculator className="w-5 h-5" />
            {t('cta')}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
