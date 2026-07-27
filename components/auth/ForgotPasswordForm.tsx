"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("PasswordRecovery");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", `/${locale}/update-password`);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: callbackUrl.toString() }
    );

    setLoading(false);

    if (resetError) {
      console.error("Password reset request failed:", resetError);
      setError(t("requestError"));
      return;
    }

    // Message volontairement générique pour ne pas révéler les comptes existants.
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-sm">
        <Image
          src="/images/logo.png"
          alt="PexxaFloor"
          width={95}
          height={62}
          priority
          className="mx-auto opacity-90"
        />

        <h1 className="mt-7 text-center text-3xl font-semibold tracking-tight text-gray-900">
          {t("requestTitle")}
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-gray-500">
          {t("requestDescription")}
        </p>

        {sent ? (
          <div className="mt-8">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {t("requestSuccess")}
            </p>
            <Link
              href={`/${locale}/login`}
              className="mt-6 block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                {t("email")}
              </span>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-3 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? t("sending") : t("sendLink")}
            </button>

            <Link
              href={`/${locale}/login`}
              className="block text-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {t("backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
