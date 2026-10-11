"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Mail, LogInIcon } from "lucide-react";
import { loginWithEmail } from "@/app/actions/loginEmail";
import { useAuth } from "@/context/AuthProvider";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthShell, { AuthAlert, AuthDivider, GoogleButton, authInputClass } from "@/components/auth/AuthShell";

export default function LoginForm({
  locale,
  passwordUpdated = false,
  nextPath,
}: {
  locale: string;
  passwordUpdated?: boolean;
  nextPath?: string;
}) {
  const t = useTranslations("Login");
  const router = useRouter();
  const { refreshUser } = useAuth();
  const safeNextPath =
    nextPath?.startsWith(`/${locale}/`) && !nextPath.startsWith(`//`)
      ? nextPath
      : undefined;

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
        if (result.error.code === "email_not_confirmed") {
          setErr(t("errors.emailNotConfirmed"));
        } else if (result.error.code === "invalid_credentials") {
          setErr(t("errors.invalidCredentials"));
        } else {
          setErr(t("errors.generic"));
        }
        return;
      }

      const user = await refreshUser();

      if (!user) {
        setErr(t("errors.sessionSync"));
        return;
      }

      router.replace(
        result.userRole === "admin"
          ? `/${locale}/admin`
          : safeNextPath || `/${locale}/profile`
      );
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setErr(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <a
            href={`/${locale}/signup${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`}
            className="font-semibold text-orange-600 transition hover:text-orange-700"
          >
            {t("createAccount")}
          </a>
        </>
      }
    >
      {passwordUpdated && (
        <div className="mb-6">
          <AuthAlert tone="success">{t("passwordUpdated")}</AuthAlert>
        </div>
      )}

      <GoogleButton
        href={`/auth/login/google?next=${encodeURIComponent(safeNextPath || `/${locale}/profile`)}`}
        label={t("google")}
      />

      <AuthDivider label={t("or")} />

      <form action={handleSubmit} className="space-y-5">
        {/* Hidden fields for server action */}
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={pwd} />

        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              name="emailField"
              autoComplete="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${authInputClass} pl-11 pr-4`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
              {t("password")}
            </label>
            <a
              href={`/${locale}/forgot-password`}
              className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
            >
              {t("forgotPassword")}
            </a>
          </div>
          <PasswordInput
            id="login-password"
            name="passwordField"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className={authInputClass}
          />
        </div>

        {err && <AuthAlert tone="error">{err}</AuthAlert>}

        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogInIcon className="h-5 w-5" />
          )}
          {t("cta")}
        </button>
      </form>
    </AuthShell>
  );
}
