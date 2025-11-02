import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import {getLocale} from 'next-intl/server';
import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const supabase = createServerComponentClient({cookies});
  const {data:{user}} = await supabase.auth.getUser();
  const locale = await getLocale();

  if (user) redirect(`/${locale}/profile`);
  return <LoginForm locale={locale} />;
}
