import { Navbar, HowItWorks, Footer, Hero, FAQSection, ProBadge } from "@/components"
 
export default function HomePage() {
  return (
    <>
      <Navbar />
      <ProBadge />
      <Hero />
      <HowItWorks />
      <FAQSection />
      <Footer />
    </>
  );
}