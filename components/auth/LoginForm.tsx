"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail, LogInIcon } from "lucide-react";
import { loginWithEmail } from "@/app/actions/loginEmail";
import { useAuth } from "@/context/AuthProvider";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginForm({
  locale,
  passwordUpdated = false,
}: {
  locale: string;
  passwordUpdated?: boolean;
}) {
  const t = useTranslations("Login");
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErr(null);

    try {
      const result = await loginWithEmail(formData);

      if (result.error) {
        setErr(
          result.error.code === "invalid_credentials"
            ? t("errors.invalidCredentials")
            : t("errors.generic")
        );
        return;
      }

      const user = await refreshUser();

      if (!user) {
        setErr(t("errors.sessionSync"));
        return;
      }

      router.replace(`/${locale}/profile`);
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setErr(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <Image
          src="/images/logo.png"
          alt="PexxaFloor Logo"
          width={110}
          height={70}
          priority
          className="opacity-90"
        />
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-gray-500">{t("subtitle")}</p>
      </div>

      <form action={handleSubmit} className="w-full max-w-sm space-y-5">

        {/* Hidden fields for server action */}
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={pwd} />

        {/* Email */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">{t("email")}</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="emailField"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-3 text-gray-900 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </label>

        {/* Password */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">{t("password")}</span>
          <PasswordInput
            name="passwordField"
            autoComplete="current-password"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 text-gray-900 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
          />
        </label>

        <div className="text-right">
          <a
            href={`/${locale}/forgot-password`}
            className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            {t("forgotPassword")}
          </a>
        </div>

        {passwordUpdated && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {t("passwordUpdated")}
          </p>
        )}

        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* CTA */}
        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-white font-medium hover:bg-orange-700 transition disabled:bg-orange-300"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogInIcon className="h-5 w-5" />
          )}
          {t("cta")}
        </button>
      </form>

      {/* Separator */}
      <div className="flex items-center w-full max-w-sm my-8">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-4 text-sm text-gray-500">{t("or")}</span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      {/* Google Login */}
      <a
        href="/auth/login/google"
        className="flex w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition"
      >
        <Image src="/images/google.png" alt="Google" width={18} height={18} />
        {t("google")}
      </a>

      {/* Link to Signup */}
      <p className="mt-6 text-sm text-gray-600">
        {t("noAccount")}{" "}
        <a
          href={`/${locale}/signup`}
          className="font-medium text-orange-600 hover:text-orange-700 transition"
        >
          {t("createAccount")}
        </a>
      </p>
    </div>
  );
}
