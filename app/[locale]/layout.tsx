import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { CartProvider } from "@/context/CartContext"
import CartDrawer from "@/components/CartDrawer";
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <>
      <div id="locale-wrapper" lang={locale}>
        <NextIntlClientProvider>
          <CartProvider>
            {children}
            <Toaster richColors position="top-center" duration={2500} />
            <CartDrawer />
          </CartProvider>
        </NextIntlClientProvider>
      </div>
    </>
  );
}