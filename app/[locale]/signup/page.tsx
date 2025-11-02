import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import {getLocale} from 'next-intl/server';
import SignupForm from '@/components/auth/SignupForm';

export default async function SignupPage() {
  const supabase = createServerComponentClient({cookies});
  const {data:{user}} = await supabase.auth.getUser();
  const locale = await getLocale();
  if (user) redirect(`/${locale}/profile`);
  return <SignupForm locale={locale} />;
}
