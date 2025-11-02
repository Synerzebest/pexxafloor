'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { Loader2, UserPlus, Mail, Lock } from 'lucide-react';

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('Signup');
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email || !pwd) return setErr(t('errors.required'));
    if (pwd.length < 8) return setErr(t('errors.tooShort'));
    if (pwd !== pwd2) return setErr(t('errors.mismatch'));

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/login`
      }
    });
    setLoading(false);

    if (error) {
      setErr(error.message);
    } else {
      setMsg(t('success'));
    }
  }

  async function signupGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/profile` }
    });
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-gray-100 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col items-center">
        <Image
          src="/images/logo.png"
          alt="PexxaFloor Logo"
          width={120}
          height={80}
          className="h-auto w-auto object-contain"
          priority
        />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="password"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition"
          />
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="password"
            placeholder="Confirmez le mot de passe"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition"
          />
        </div>

        {/* Messages */}
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}

        {/* Submit */}
        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 py-2 text-white font-medium shadow hover:from-orange-600 hover:to-amber-700 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          {t('cta')}
        </button>
      </form>

      {/* Separator */}
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 text-sm text-gray-400">{t('or')}</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Google signup */}
      <button
        onClick={signupGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <Image src="/images/google.png" alt="Google" width={18} height={18} />
        {t('google')}
      </button>

      {/* Link to login */}
      <div className="mt-6 text-center text-sm text-gray-600">
        {t('alreadyAccount')}{" "}
        <a
          href={`/${locale}/login`}
          className="font-medium text-orange-600 hover:text-orange-700 transition"
        >
          {t('login')}
        </a>
      </div>
    </div>
  );
}
