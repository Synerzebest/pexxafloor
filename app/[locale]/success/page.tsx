"use client";

import { motion } from "framer-motion";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Navbar, Footer } from "@/components";
import { useCart } from "@/context/CartContext";
import { useEffect } from "react";

export default function SuccessPage() {
  const locale = useLocale();
  const t = useTranslations("Success");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-6 text-center relative top-24">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <CheckCircleTwoTone twoToneColor="#ff7f00" style={{ fontSize: "80px" }} />
          <h1 className="text-3xl font-bold mt-6">
            {t("payment_successfull")} 🎉
          </h1>
          <p className="text-gray-600 mt-3">{t("payment_informations")}</p>

          <div className="flex gap-4 mt-8">
            <Link
              className="bg-orange-500 rounded-lg text-white p-2"
              href={`/${locale}/profile`}
            >
              {t("check_order")}
            </Link>
            <Link
              href="/"
              className="border border-gray-100 rounded-lg p-2 shadow"
            >
              {t("back_home")}
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="relative top-36">
        <Footer />
      </div>
    </>
  );
}
