"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import PasswordInput from "@/components/ui/PasswordInput";

export default function UpdatePasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("PasswordRecovery");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (cancelled) return;
      setHasSession(!userError && Boolean(data.user));
      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (password !== confirmation) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error("Password update failed:", updateError);
      setError(t("updateError"));
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace(`/${locale}/login?passwordUpdated=1`);
    router.refresh();
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
          {t("updateTitle")}
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-gray-500">
          {t("updateDescription")}
        </p>

        {checkingSession ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : !hasSession ? (
          <div className="mt-8">
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {t("invalidLink")}
            </p>
            <Link
              href={`/${locale}/forgot-password`}
              className="mt-6 block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              {t("requestAnotherLink")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <PasswordField
              label={t("newPassword")}
              value={password}
              onChange={setPassword}
            />
            <PasswordField
              label={t("confirmPassword")}
              value={confirmation}
              onChange={setConfirmation}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? t("updating") : t("updatePassword")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-2">
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </div>
    </label>
  );
}
