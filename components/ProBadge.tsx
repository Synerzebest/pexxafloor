import { Briefcase } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

const ProBadge = () => {
    const locale = useLocale();
  return (
    <Link
      href={`/${locale}/pro`}
      className="fixed top-24 sm:top-32 right-0 z-40 group"
    >
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-500 text-primary-foreground px-4 py-3 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:pr-6 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-white" />
        <div className="flex flex-col text-white">
          <span className="font-display font-bold text-sm">Espace PRO</span>
          <span className="text-xs opacity-90">Remises exclusives</span>
        </div>
      </div>
    </Link>
  );
};

export default ProBadge;