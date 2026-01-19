import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { CartProvider } from "@/context/CartContext"
import CartDrawer from "@/components/CartDrawer";
import { AuthProvider } from '@/context/AuthProvider';
import { Toaster } from "sonner";
import { UIProvider } from "@/context/UIContext"
import { StoreDataProvider } from "@/context/StoreDataProvider";

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
          <AuthProvider>
            <StoreDataProvider>
              <CartProvider>
                <UIProvider>
                  {children}
                </UIProvider>
                <Toaster richColors position="top-center" duration={2500} />
                <CartDrawer />
              </CartProvider>
            </StoreDataProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </div>
    </>
  );
}