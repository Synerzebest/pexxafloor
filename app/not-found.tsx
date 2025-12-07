import Link from "next/link"; 
import { useTranslations } from 'next-intl';

function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    // Conteneur principal: fond blanc, prend toute la hauteur de l'écran, centre le contenu
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 p-6 relative overflow-hidden">
      {/* Grand 404 en arrière-plan, semi-transparent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] md:text-[30rem] lg:text-[40rem] font-extrabold text-gray-200 opacity-60 pointer-events-none z-0 select-none">
        404
      </div>

      {/* Contenu principal de la page, au-dessus du 404 en arrière-plan */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8">

        {/* Message */}
        <p className="text-3xl md:text-4xl font-semibold text-gray-700 mt-4">
          {t('title')}
        </p>
        <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto">
          {t('subtitle')}
        </p>

        {/* Bouton de retour à l'accueil */}
        <Link href="/" className="bg-orange-500 hover:bg-orange-600 duration-300 text-white px-5 py-3 rounded-lg font-bold">
            {t('backHome')}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;