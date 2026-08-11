import { Briefcase, Truck, Percent, Clock, Shield, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Pro = () => {
    const locale = useLocale();
    const t = useTranslations("ProLanding");
    const benefits = [
      { icon: Percent, key: "discounts" },
      { icon: Truck, key: "delivery" },
      { icon: Clock, key: "priority" },
      { icon: Shield, key: "support" },
    ] as const;
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-16 relative top-6 sm:top-14">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-orange-500/10 via-orange-500/10 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary/50 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full mb-6">
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">{t("badge")}</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                {t("title.first")}{" "}
                <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">{t("title.second")}</span>
              </h1>
              
              <p className="text-lg text-gray-500 mb-8">
                {t("description")}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-center text-gray-800 mb-12">
              {t("benefitsTitle")}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-2xl border border-gray-300 hover:border-orange-500/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 via-orange-400/80 to-orange-400 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {t(`benefits.${benefit.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`benefits.${benefit.key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="w-full flex justify-center">
            <Link
                href={`/${locale}/pro-signup`}
                className="
                inline-flex items-center gap-2 px-8 py-4 rounded-xl
                bg-gradient-to-r from-orange-500 to-orange-400
                text-white font-semibold shadow-md
                hover:shadow-lg hover:brightness-105
                transition-all duration-300 group
                "
            >
                {t("cta")}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pro;
