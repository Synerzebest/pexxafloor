import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { CartProvider } from "@/context/CartContext"
import CartDrawer from "@/components/CartDrawer";
import { Toaster } from "sonner";

export default async function LocaleLayout({ // Renommé de RootLayout à LocaleLayout pour la clarté
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
    // --- IMPORTANT: RETIRER <html> et <body> ici
    <>
      <div id="locale-wrapper" lang={locale}> {/* Optionnel: Vous pouvez définir 'lang' sur un div pour les lecteurs d'écran */}
        <NextIntlClientProvider>
          <CartProvider>
            {children}
            <Toaster richColors position="top-center" duration={2500} />
            <CartDrawer />
          </CartProvider>
        </NextIntlClientProvider>
      </div>
    </>
    // --- IMPORTANT: RETIRER <html> et <body> ici
  );
}