import {getLocale} from 'next-intl/server';
import ProSignupForm from '@/components/pro/ProSignupForm';
import { Navbar, Footer } from "@/components"

export default async function ProSignupPage() {
  const locale = await getLocale();

  return (
      <>
        <Navbar />
        <ProSignupForm locale={locale} />
        <div className="relative top-36">
          <Footer />
        </div>
      </>
  );
}
