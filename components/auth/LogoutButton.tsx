'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LogoutButton() {
  const router = useRouter();
  const tc = useTranslations('Common');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // force la mise à jour des pages server (ProfilePage redirigera)
  };

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer my-4 px-4 py-2 flex items-center gap-2 text-red-500 border border-red-500 rounded-lg"
    >
      <LogOutIcon />
      {tc('logout')}
    </button>
  );
}
