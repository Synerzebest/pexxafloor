"use client";

import { useState } from "react";
import { motion } from "framer-motion"; // Gardé pour la rotation de l'icône
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQSection() {
  const t = useTranslations("FAQ");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [1, 2, 3].map((number) => ({
    question: t(`items.${number}.question`),
    answer: t(`items.${number}.answer`),
  }));

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-24" id="faq">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
        {/* Titre */}
        <h2 className="text-4xl font-extrabold text-gray-900 mb-12 relative">
          {t("title.first")} <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{t("title.second")}</span>
          <span className="block h-1 w-20 mx-auto mt-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></span>
        </h2>

        <div className="space-y-4 w-full">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`
                  bg-white
                  rounded-xl shadow-lg transition-all duration-300
                  ${isOpen 
                    ? "shadow-orange-100/70 ring-2 ring-orange-500/50" 
                    : "hover:shadow-xl hover:shadow-gray-100/70"}
                `}
              >
                {/* Header question - Cliquable */}
                <div
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-start justify-between p-5 cursor-pointer select-none"
                >
                  <span
                    className={`
                      text-lg font-semibold transition-colors duration-300 flex-1 pr-4
                      ${isOpen ? "text-orange-600" : "text-gray-900"}
                    `}
                  >
                    {faq.question}
                  </span>

                  {/* Icône animée (rotation conservée pour la fluidité) */}
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0 pt-1"
                  >
                    <ChevronDown
                      className={`w-6 h-6 transition-colors duration-300
                        ${isOpen ? "text-orange-500" : "text-gray-400"}
                      `}
                    />
                  </motion.div>
                </div>

                {/* Réponse (Apparition/Disparition instantanée par conditionnel) */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
