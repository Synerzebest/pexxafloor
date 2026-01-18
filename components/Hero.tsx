"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Calculator, Boxes } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const locale = useLocale();
  const t = useTranslations("Hero");

  return (
    <section
      className="
        relative w-full top-20 md:top-28
        h-[82vh] md:h-[82vh] 
        flex items-center justify-start 
        overflow-hidden
        px-4 sm:px-6
        py-10 md:py-0
      "
    >
      {/* Background Image */}
      <Image
        src="/images/hero.jpeg"
        alt="Floor heating background"
        fill
        priority
        className="object-cover opacity-40"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-white/40"></div>

      {/* Content */}
      <div
        className="
          relative z-10 
          max-w-3xl 
          pl-0 md:pl-20
          text-center md:text-left
          mx-auto md:mx-0
        "
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="
            font-extrabold leading-tight text-gray-900 pt-2
            text-4xl sm:text-5xl md:text-6xl
          "
        >
          {t("title")} <br />
          <span className="text-orange-500">{t("subtitle")}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="
            mt-4 text-lg text-gray-700 
            max-w-xl 
            mx-auto md:mx-0
          "
        >
          <b>{t("description.bold1")}</b>
          {t("description.text1")}
          <b>{t('description.bold2')}</b>
          {t('description.text2')}
        </motion.p>

        {/* CTA buttons */}
        <div
          className="
            mt-8 flex gap-4 
            flex-col sm:flex-row 
            justify-center md:justify-start
          "
        >
          {/* Button 1 */}
          <Link
            href={`/${locale}/quote`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="
                cursor-pointer flex items-center gap-2 
                bg-orange-500 hover:bg-orange-600 
                text-white font-semibold 
                px-6 py-3 rounded-lg 
                shadow-lg transition duration-300
                w-full sm:w-auto
                justify-center
              "
            >
              <Calculator size={18} />
              {t("calculate_button")}
            </motion.button>
          </Link>

          {/* Button 2 */}
          <Link
            href={`/${locale}/categories`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1}}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="
                cursor-pointer flex items-center gap-2 
                border-2 border-orange-400 text-orange-600 
                hover:bg-orange-50 font-semibold 
                px-6 py-3 rounded-lg 
                transition duration-300
                w-full sm:w-auto
                justify-center
              "
            >
              <Boxes size={18} />
              {t("products_button")}
            </motion.button>
          </Link>
        </div>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="
            inline-flex items-center gap-2 
            rounded-full border border-orange-200 bg-orange-50 
            px-3 py-2 text-xs font-medium text-orange-700 shadow-sm
            mx-auto md:mx-0 mt-5
          "
        >
          {/* Animated Dot */}
          <motion.div
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: ["#fdba74", "#f97316", "#ea580c", "#f97316", "#fdba74"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <span className="text-orange-600">{t("badge")}</span>
        </motion.div>
      </div>
    </section>
  );
}
