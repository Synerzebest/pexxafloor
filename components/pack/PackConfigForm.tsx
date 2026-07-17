"use client";

import { InputNumber } from "antd";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useTranslations } from "next-intl";

type Props = {
  slug: string;
  surface: number;
  pasDePose: number;
  tuyauType: "PERT" | "PERT-AL-PERT";
  typeAgrafe: 40 | 60;
  typeIsolation: 0 | 15 | 30;
  projectReference?: string;
  onSurfaceChange: (v: number) => void;
  onPasDePoseChange: (v: number) => void;
  onTuyauTypeChange: (v: "PERT" | "PERT-AL-PERT") => void;
  onTypeAgrafeChange: (v: 40 | 60) => void;
  onTypeIsolationChange: (v: 0 | 15 | 30) => void;
};

export function PackConfigForm({
  slug,
  surface,
  pasDePose,
  tuyauType,
  typeAgrafe,
  typeIsolation,
  projectReference,
  onSurfaceChange,
  onPasDePoseChange,
  onTuyauTypeChange,
  onTypeAgrafeChange,
  onTypeIsolationChange
}: Props) {
  const t = useTranslations('PackConfig');
  const tuyauOptions = ["PERT", "PERT-AL-PERT"] as const;
  const tubLength = (surface / pasDePose) * 100;
  const circuitsNumber = Math.ceil(tubLength / 100);

  const [showIsolationHelp, setShowIsolationHelp] = useState(false);

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };
  
  const modalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 22,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
  };
  
  const gridVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };
  
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 18,
      },
    },
  };  

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
      <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('settings')}
        </h2>
        {projectReference && (
          <span className="inline-flex w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
            {projectReference}
          </span>
        )}
      </div>

      {/* Pas de pose + Type de tuyau */}
      <div className="md:flex md:gap-6 space-y-6 md:space-y-0">
        {/* Pas de pose */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('step.title')}
          </label>

          <div className="flex gap-2">
            {[20, 15, 10].map((val) => {
              const tooltips: Record<number, string> = {
                20: t('step.tooltip20'),
                15: t('step.tooltip15'),
                10: t('step.tooltip10'),
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onPasDePoseChange(val)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                      ${
                        pasDePose === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val} cm
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type de tuyau */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('tuyauType.title')}
          </label>

          <div className="flex gap-2">
            {tuyauOptions.map((val) => {
              const tooltips: Record<string, string> = {
                "PERT": `${t('tuyauType.tooltipPERT')}`,
                "PERT-AL-PERT": `${t('tuyauType.tooltipPERTALPERT')}`
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onTuyauTypeChange(val)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                      ${
                        tuyauType === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val}
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agrafes (uniquement pour le pack agrafe) */}
      {slug === "agrafe" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('agrafe.title')}
          </label>

          <div className="flex gap-2">
            {[40, 60].map((val) => {
              const tooltips: Record<number, string> = {
                40: `${t('agrafe.tooltip40')}`,
                60: `${t('agrafe.tooltip60')}`,
              };

              return (
                <div key={val} className="relative group">
                  <button
                    onClick={() => onTypeAgrafeChange(val as 40 | 60)}
                    className={`px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                      ${
                        typeAgrafe === val
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                      }`}
                  >
                    {val} mm
                  </button>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                    {tooltips[val]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surface (+ Isolation pour le pack natte) */}
      <div className="flex flex-col-reverse sm:flex-row gap-6">
        {/* Surface (TOUJOURS visible) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('surfaceToHeat')}
          </label>

          <div className="flex items-center gap-2">
            <InputNumber
              min={1}
              value={surface}
              onChange={(v) => onSurfaceChange(Number(v))}
              size="large"
              className="w-24"
            />
            <span className="text-gray-500">m²</span>
          </div>

          <p className="text-gray-500 text-sm mt-1">
            {t('estimatedPipe')} : {Math.ceil(tubLength)} m – {t('circuits')} : {circuitsNumber}
          </p>
        </div>

        {/* Isolation (uniquement natte) */}
        {slug === "natte" && (
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              {t('insulation.title')}
              <button
                type="button"
                onClick={() => setShowIsolationHelp(true)}
                className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition"
                aria-label="Help"
              >
                ?
              </button>
            </label>

            <div className="flex gap-2">
              {[0, 15, 30].map((val) => {
                const tooltips: Record<number, string> = {
                  0: `${t('insulation.tooltip0')}`,
                  15: `${t('insulation.tooltip15')}`,
                  30: `${t('insulation.tooltip30')}`,
                };

                return (
                  <div key={val} className="relative group">
                    <button
                      onClick={() => onTypeIsolationChange(val as 0 | 15 | 30)}
                      className={`px-4 py-1.5 rounded-lg text-sm border transition cursor-pointer
                        ${
                          typeIsolation === val
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500"
                        }`}
                    >
                      {val} mm
                    </button>

                    <span className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg transition">
                      {tooltips[val]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Modal aide isolation */}
      {showIsolationHelp && (
        <AnimatePresence>
        {showIsolationHelp && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowIsolationHelp(false)}
          >
            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-xl bg-white p-5 sm:p-6 shadow-xl
                max-h-[90vh] sm:max-h-[85vh] overflow-scroll"
            >
              {/* Close */}
              <button
                onClick={() => setShowIsolationHelp(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition"
              >
                ✕
              </button>
      
              <h3 className="mb-6 text-lg font-semibold text-gray-800">
                {t('insulation.availableInsulation')}
              </h3>
      
              {/* Grid */}
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 sm:grid-cols-3"
              >
                {[
                  {
                    value: 0,
                    title: "0 mm",
                    desc: `${t('insulation.tooltip0')}`,
                    img: "/images/isolation-0.jpeg",
                  },
                  {
                    value: 15,
                    title: "15 mm",
                    desc: `${t('insulation.tooltip15')}`,
                    img: "/images/isolation-15.jpeg",
                  },
                  {
                    value: 30,
                    title: "30 mm",
                    desc: `${t('insulation.tooltip30')}`,
                    img: "/images/isolation-30.jpeg",
                  },
                ].map((item) => (
                  <motion.div
                    key={item.value}
                    variants={cardVariants}
                    className="rounded-lg border border-gray-200 p-3 text-center bg-white"
                  >
                    <div className="relative mb-3 h-32 w-full overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={item.img}
                        alt={`Isolation ${item.title}`}
                        fill
                        className="object-cover"
                      />
                    </div>
      
                    <p className="font-semibold text-gray-800">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      )}
    </div>
  );
}
