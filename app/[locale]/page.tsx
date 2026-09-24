import JsonLd from "@/components/seo/JsonLd";
import HomePackLinks from "@/components/seo/HomePackLinks";
import { SITE_URL } from "@/lib/seo/metadata";
import { staticMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticMetadata((await params).locale, "home");
}

import { Navbar, HowItWorks, Footer, Hero, FAQSection, ProBadge, BestSellerSection } from "@/components"
 
export default function HomePage() {

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "PexxaFloor", url: SITE_URL, logo: `${SITE_URL}/images/logo.png`, email: "info@pexxafloor.be" },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "PexxaFloor", url: SITE_URL, inLanguage: ["fr", "nl", "en"], publisher: { "@id": `${SITE_URL}/#organization` } },
        ],
      }} />
      <Navbar />
      <ProBadge />
      <Hero />
      <HowItWorks />
      <HomePackLinks />
      <BestSellerSection />
      <FAQSection />
      <Footer />
    </>
  );
}
