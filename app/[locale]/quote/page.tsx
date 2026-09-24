import { staticMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticMetadata((await params).locale, "quote");
}

import { Navbar, Footer, ProBadge } from '@/components';
import { SurfaceWrapper } from '@/components';

const page = () => {
    return (
        <>
          <Navbar />
          <ProBadge />
          <SurfaceWrapper />
          <Footer />  
        </>
    )
}

export default page
