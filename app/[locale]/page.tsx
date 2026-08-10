import { Navbar, HowItWorks, Footer, Hero, FAQSection, ProBadge, BestSellerSection } from "@/components"
import HomeInfoSidebar from "@/components/HomeInfoSidebar";
 
export default function HomePage() {

  return (
    <>
      <Navbar />
      <ProBadge />
      <Hero />
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-2 lg:order-1 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <HomeInfoSidebar />
        </div>
        <div className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1">
          <HowItWorks />
        </div>
        <div className="order-3 lg:col-start-2 lg:row-start-2">
          <BestSellerSection />
        </div>
        <div className="order-4 lg:col-span-2 lg:row-start-3">
          <FAQSection />
        </div>
      </div>
      <Footer />
    </>
  );
}
