import { Navbar, HowItWorks, Footer, Hero, FAQSection, ProBadge, BestSellerSection } from "@/components"
 
export default function HomePage() {

  return (
    <>
      <Navbar />
      <ProBadge />
      <Hero />
      <HowItWorks />
      <BestSellerSection />
      <FAQSection />
      <Footer />
    </>
  );
}
