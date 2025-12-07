"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="w-full py-24 relative overflow-hidden bg-white">
      {/* Décor léger */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 to-white" />

      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
        {/* Texte */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Le chauffage au sol,
            <br />
            <span className="text-orange-500">simple, rapide, efficace.</span>
          </h1>

          <p className="mt-4 text-lg text-gray-600 max-w-md">
            Configurez votre pack complet en quelques secondes.  
            Entrez votre surface, et nous vous fournissons tout le matériel nécessaire.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 transition">
              Calculer mon pack
            </button>

            <button className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition">
              Voir les produits
            </button>
          </div>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 flex justify-center"
        >
          <Image
            src="/images/hero.png" // mets ton image ici
            alt="Chauffage au sol illustration"
            width={480}
            height={380}
          />
        </motion.div>
      </div>
    </section>
  );
}
